import { useCallback, useEffect, useRef, useState } from 'react'
import type { Gasto, Informe, Mensaje, Nivel, Tema } from '../nucleo/tipos.ts'
import { calcularGasto, type Uso } from '../nucleo/presupuesto.ts'
import { terminosDe } from '../nucleo/temas.ts'
import { crearEscucha, type Escucha } from '../voz/reconocimiento.ts'
import { crearLocutor, type Locutor } from '../voz/sintesis.ts'

export type FaseConversacion = 'reposo' | 'grabando' | 'pensando' | 'hablando'

interface Opciones {
  nivel: Nivel
  tema: Tema
  voz: SpeechSynthesisVoice | null
  /** Lo que se repite en informes anteriores, para que el tutor lo provoque. */
  erroresPrevios: string[]
  /** False cuando se ha agotado el presupuesto: no se manda ni un turno más. */
  hayPresupuesto: boolean
  alGastar(gasto: Gasto): void
}

/**
 * El turno de palabra.
 *
 * Un solo sitio decide quién habla. El micrófono se abre porque tú pulsas y
 * se cierra porque tú sueltas: no hay detección de silencio ni encadenado
 * automático. Aprendiendo un idioma te paras a pensar, y una app que
 * interpreta esa pausa como "ya he terminado" te corta justo cuando estabas
 * construyendo la frase.
 */
export function usarConversacion(opciones: Opciones) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [parcial, setParcial] = useState('')
  const [fase, setFase] = useState<FaseConversacion>('reposo')
  const [error, setError] = useState<string | null>(null)
  const [costeEur, setCosteEur] = useState(0)
  const [informe, setInforme] = useState<Informe | null>(null)
  const [generandoInforme, setGenerandoInforme] = useState(false)

  const locutorRef = useRef<Locutor | null>(null)
  const escuchaRef = useRef<Escucha | null>(null)
  const abortoRef = useRef<AbortController | null>(null)
  const inicioRef = useRef<number>(0)

  // Las opciones cambian mientras hay una conversación viva (cambias de voz,
  // se agota el saldo). Los callbacks de voz son de usar y tirar, así que
  // leen de aquí en vez de quedarse con la versión del render que los creó.
  const opcionesRef = useRef(opciones)
  opcionesRef.current = opciones

  // El historial también: `colgar` se llama desde un botón y necesita la
  // conversación entera sin volver a crearse en cada mensaje nuevo.
  const mensajesRef = useRef<Mensaje[]>([])
  mensajesRef.current = mensajes

  const anotarUso = useCallback((uso: Uso) => {
    const gasto = calcularGasto(uso)
    setCosteEur((previo) => previo + gasto.eur)
    opcionesRef.current.alGastar(gasto)
  }, [])

  const callar = useCallback(() => {
    locutorRef.current?.cancelar()
    locutorRef.current = null
    abortoRef.current?.abort()
    abortoRef.current = null
  }, [])

  const hablar = useCallback(() => {
    const locutor = crearLocutor({
      voz: opcionesRef.current.voz,
      alEmpezar: () => setFase('hablando'),
      alCallar: () => {
        locutorRef.current = null
        // Se acabó su turno y no se abre el micro solo: te toca pulsar.
        setFase((actual) => (actual === 'hablando' ? 'reposo' : actual))
      },
    })
    locutorRef.current = locutor
    return locutor
  }, [])

  const responder = useCallback(
    async (dicho: string) => {
      if (!opcionesRef.current.hayPresupuesto) {
        setError('Se ha agotado el presupuesto del mes. Puedes subirlo en Ajustes.')
        setFase('reposo')
        return
      }

      const mio: Mensaje = { id: crypto.randomUUID(), papel: 'yo', texto: dicho }
      const suyo: Mensaje = { id: crypto.randomUUID(), papel: 'tutor', texto: '' }

      let historial: Mensaje[] = []
      setMensajes((previos) => {
        historial = [...previos, mio]
        return [...historial, suyo]
      })

      setFase('pensando')
      setError(null)
      const locutor = hablar()

      const aborto = new AbortController()
      abortoRef.current = aborto

      try {
        const tema = opcionesRef.current.tema
        const respuesta = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: aborto.signal,
          body: JSON.stringify({
            nivel: opcionesRef.current.nivel,
            tema: {
              titulo: tema.titulo,
              descripcion: tema.descripcion,
              funciones: tema.funciones,
              terminos: terminosDe(tema),
            },
            erroresPrevios: opcionesRef.current.erroresPrevios,
            mensajes: historial.map((m) => ({ papel: m.papel, texto: m.texto })),
          }),
        })

        if (!respuesta.ok || !respuesta.body) {
          const fallo = await respuesta.json().catch(() => null)
          throw new Error(fallo?.error ?? 'El servidor no ha respondido.')
        }

        const lector = respuesta.body.getReader()
        const decodificador = new TextDecoder()
        let resto = ''

        for (;;) {
          const { done, value } = await lector.read()
          if (done) break
          resto += decodificador.decode(value, { stream: true })

          const bloques = resto.split('\n\n')
          resto = bloques.pop() ?? ''

          for (const bloque of bloques) {
            const linea = bloque.trim()
            if (!linea.startsWith('data:')) continue

            let dato: { t: string; v: unknown }
            try {
              dato = JSON.parse(linea.slice(5))
            } catch {
              continue
            }

            if (dato.t === 'texto' && typeof dato.v === 'string') {
              setMensajes((previos) =>
                previos.map((m) => (m.id === suyo.id ? { ...m, texto: m.texto + dato.v } : m)),
              )
              locutor.empujar(dato.v as string)
            } else if (dato.t === 'uso') {
              anotarUso(dato.v as Uso)
            } else if (dato.t === 'error' && typeof dato.v === 'string') {
              setError(dato.v)
            }
          }
        }

        locutor.cerrar()
      } catch (fallo) {
        locutor.cancelar()
        locutorRef.current = null
        if ((fallo as Error).name !== 'AbortError') setError((fallo as Error).message)
        setFase('reposo')
      } finally {
        abortoRef.current = null
      }
    },
    [anotarUso, hablar],
  )

  /* ── El micrófono ────────────────────────────────────────────────────── */

  const empezarGrabacion = useCallback(() => {
    if (!opcionesRef.current.hayPresupuesto) {
      setError('Se ha agotado el presupuesto del mes. Puedes subirlo en Ajustes.')
      return
    }

    // Interrumpirla a media frase es lo normal hablando; esperar a que acabe
    // su párrafo hace que la app se sienta lenta.
    callar()
    setError(null)
    setParcial('')

    const escucha = crearEscucha({
      alParcial: setParcial,
      alEntregar: (texto) => {
        setParcial('')
        responder(texto)
      },
      alCancelar: () => {
        setParcial('')
        setFase((actual) => (actual === 'grabando' ? 'reposo' : actual))
      },
      alFallar: (mensaje) => {
        setError(mensaje)
        setParcial('')
        setFase('reposo')
      },
    })

    escuchaRef.current = escucha
    setFase('grabando')
    escucha.empezar()
  }, [callar, responder])

  const soltarGrabacion = useCallback(() => {
    escuchaRef.current?.soltar()
  }, [])

  const cancelarGrabacion = useCallback(() => {
    escuchaRef.current?.cancelar()
    setParcial('')
    setFase('reposo')
  }, [])

  /* ── Principio y final ───────────────────────────────────────────────── */

  /** Primer turno: la frase de arranque está escrita, así que suena al instante. */
  const arrancar = useCallback(() => {
    setError(null)
    setInforme(null)
    setCosteEur(0)
    inicioRef.current = Date.now()

    const suyo: Mensaje = {
      id: crypto.randomUUID(),
      papel: 'tutor',
      texto: opcionesRef.current.tema.arranque,
    }
    setMensajes([suyo])

    const locutor = hablar()
    locutor.empujar(suyo.texto)
    locutor.cerrar()
  }, [hablar])

  /**
   * Colgar. Aquí es donde se corrige todo lo que no se corrigió hablando.
   * El presupuesto reserva siempre lo que cuesta esta llamada, para que no
   * pueda pasar que te quedes justo sin la parte que enseña.
   */
  const colgar = useCallback(async () => {
    callar()
    escuchaRef.current?.cancelar()
    setFase('reposo')
    setParcial('')

    const conversacion = mensajesRef.current
    const tema = opcionesRef.current.tema
    const turnos = conversacion.filter((m) => m.papel === 'yo').length

    if (turnos < 2) {
      setError('Habla un poco más y te hago el informe.')
      return null
    }

    setGenerandoInforme(true)
    setError(null)

    try {
      const respuesta = await fetch('/api/informe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tema: { titulo: tema.titulo, descripcion: tema.descripcion },
          terminos: terminosDe(tema),
          mensajes: conversacion.map((m) => ({ papel: m.papel, texto: m.texto })),
        }),
      })

      const datos = await respuesta.json()
      if (!respuesta.ok) throw new Error(datos?.error ?? 'No se ha podido generar el informe.')

      if (datos.uso) anotarUso(datos.uso as Uso)

      const generado: Informe = {
        id: crypto.randomUUID(),
        temaId: tema.id,
        temaTitulo: tema.titulo,
        fecha: Date.now(),
        turnos,
        duracionMs: Date.now() - inicioRef.current,
        fallos: Array.isArray(datos.informe?.fallos) ? datos.informe.fallos : [],
        mejoras: Array.isArray(datos.informe?.mejoras) ? datos.informe.mejoras : [],
        aciertos: Array.isArray(datos.informe?.aciertos) ? datos.informe.aciertos : [],
        usadas: Array.isArray(datos.informe?.usadas) ? datos.informe.usadas : [],
        noUsadas: Array.isArray(datos.informe?.noUsadas) ? datos.informe.noUsadas : [],
      }

      setInforme(generado)
      return generado
    } catch (fallo) {
      setError((fallo as Error).message)
      return null
    } finally {
      setGenerandoInforme(false)
    }
  }, [anotarUso, callar])

  const reiniciar = useCallback(() => {
    callar()
    escuchaRef.current?.cancelar()
    setMensajes([])
    setParcial('')
    setInforme(null)
    setError(null)
    setCosteEur(0)
    setFase('reposo')
  }, [callar])

  // Salir de la pantalla con el sintetizador hablando lo deja hablando: la
  // síntesis vive en el navegador, no en el componente.
  useEffect(
    () => () => {
      escuchaRef.current?.cancelar()
      locutorRef.current?.cancelar()
      abortoRef.current?.abort()
    },
    [],
  )

  return {
    mensajes,
    parcial,
    fase,
    error,
    costeEur,
    informe,
    generandoInforme,
    arrancar,
    empezarGrabacion,
    soltarGrabacion,
    cancelarGrabacion,
    escribir: responder,
    colgar,
    reiniciar,
  }
}
