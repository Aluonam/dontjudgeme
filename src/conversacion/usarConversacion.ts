import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ficha, Mensaje, Nivel, Situacion } from '../nucleo/tipos.ts'
import { crearEscucha, type Escucha } from '../voz/reconocimiento.ts'
import { crearLocutor, type Locutor } from '../voz/sintesis.ts'

export type FaseConversacion = 'reposo' | 'escuchando' | 'pensando' | 'hablando'

interface Opciones {
  nivel: Nivel
  situacion: Situacion
  manosLibres: boolean
  voz: SpeechSynthesisVoice | null
  /** Se llama con cada ficha del tutor para que el cuaderno la recoja. */
  alAprender(ficha: Ficha): void
}

/**
 * El turno de palabra.
 *
 * Un solo sitio decide quién habla: mientras el tutor habla, el micrófono
 * está cerrado; en cuanto calla, se abre solo si vas en manos libres. Tener
 * esto repartido entre componentes era la receta segura para que se pisaran.
 */
export function usarConversacion(opciones: Opciones) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [parcial, setParcial] = useState('')
  const [fase, setFase] = useState<FaseConversacion>('reposo')
  const [error, setError] = useState<string | null>(null)

  const locutorRef = useRef<Locutor | null>(null)
  const escuchaRef = useRef<Escucha | null>(null)
  const abortoRef = useRef<AbortController | null>(null)
  const dijoAlgoRef = useRef(false)

  // Las opciones cambian mientras hay una conversación viva (cambias de voz,
  // apagas manos libres). Los callbacks de voz son de usar y tirar, así que
  // leen de aquí en vez de quedarse con la versión del render que los creó.
  const opcionesRef = useRef(opciones)
  opcionesRef.current = opciones

  const anadirTexto = useCallback((id: string, trozo: string) => {
    setMensajes((previos) =>
      previos.map((m) => (m.id === id ? { ...m, texto: m.texto + trozo } : m)),
    )
  }, [])

  const escuchar = useCallback(() => {
    setError(null)
    setParcial('')
    dijoAlgoRef.current = false

    const escucha = crearEscucha({
      alParcial: setParcial,
      alFinal: (texto) => {
        if (!texto) return
        dijoAlgoRef.current = true
        setParcial('')
        responder(texto)
      },
      alTerminar: () => {
        setParcial('')
        // Si no dijo nada, no encadenamos otra escucha: se quedaría el
        // micro abierto en bucle sin que nadie lo haya pedido.
        setFase((actual) => (actual === 'escuchando' && !dijoAlgoRef.current ? 'reposo' : actual))
      },
      alFallar: (mensaje) => {
        setError(mensaje)
        setFase('reposo')
      },
    })

    escuchaRef.current = escucha
    setFase('escuchando')
    escucha.empezar()
    // `responder` se declara más abajo a propósito: solo se lee cuando el
    // micrófono ya ha entregado una frase, mucho después del primer render.
  }, [])

  const hablar = useCallback((alAcabar: () => void) => {
    const locutor = crearLocutor({
      voz: opcionesRef.current.voz,
      alEmpezar: () => setFase('hablando'),
      alCallar: () => {
        locutorRef.current = null
        alAcabar()
      },
    })
    locutorRef.current = locutor
    return locutor
  }, [])

  const trasHablar = useCallback(() => {
    if (opcionesRef.current.manosLibres) escuchar()
    else setFase('reposo')
  }, [escuchar])

  const responder = useCallback(
    async (dicho: string) => {
      const mio: Mensaje = { id: crypto.randomUUID(), papel: 'yo', texto: dicho }
      const suyo: Mensaje = { id: crypto.randomUUID(), papel: 'tutor', texto: '' }

      let historial: Mensaje[] = []
      setMensajes((previos) => {
        historial = [...previos, mio]
        return [...historial, suyo]
      })

      setFase('pensando')
      const locutor = hablar(trasHablar)

      const aborto = new AbortController()
      abortoRef.current = aborto

      try {
        const respuesta = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: aborto.signal,
          body: JSON.stringify({
            nivel: opcionesRef.current.nivel,
            situacion: {
              titulo: opcionesRef.current.situacion.titulo,
              descripcion: opcionesRef.current.situacion.descripcion,
            },
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
              anadirTexto(suyo.id, dato.v)
              locutor.empujar(dato.v)
            } else if (dato.t === 'coach') {
              const ficha = normalizar(dato.v)
              setMensajes((previos) =>
                previos.map((m) => (m.id === suyo.id ? { ...m, ficha } : m)),
              )
              opcionesRef.current.alAprender(ficha)
            } else if (dato.t === 'error' && typeof dato.v === 'string') {
              setError(dato.v)
            }
          }
        }

        locutor.cerrar()
      } catch (fallo) {
        locutor.cancelar()
        locutorRef.current = null
        if ((fallo as Error).name !== 'AbortError') {
          setError((fallo as Error).message)
        }
        setFase('reposo')
      } finally {
        abortoRef.current = null
      }
    },
    [anadirTexto, hablar, trasHablar],
  )

  /** Primer turno: la frase de arranque está escrita, así que suena al instante. */
  const arrancar = useCallback(() => {
    setError(null)
    const suyo: Mensaje = {
      id: crypto.randomUUID(),
      papel: 'tutor',
      texto: opcionesRef.current.situacion.arranque,
    }
    setMensajes([suyo])
    const locutor = hablar(trasHablar)
    locutor.empujar(suyo.texto)
    locutor.cerrar()
  }, [hablar, trasHablar])

  /** El botón del micrófono. Hace lo evidente según quién tenga la palabra. */
  const pulsarMicro = useCallback(() => {
    if (fase === 'escuchando') {
      escuchaRef.current?.parar()
      return
    }
    // Interrumpir al tutor a media frase es lo normal hablando; si hay que
    // esperar a que acabe su párrafo, la app se siente lenta.
    locutorRef.current?.cancelar()
    locutorRef.current = null
    abortoRef.current?.abort()
    escuchar()
  }, [fase, escuchar])

  const parar = useCallback(() => {
    escuchaRef.current?.abortar()
    locutorRef.current?.cancelar()
    locutorRef.current = null
    abortoRef.current?.abort()
    setParcial('')
    setFase('reposo')
  }, [])

  const reiniciar = useCallback(() => {
    parar()
    setMensajes([])
    setError(null)
  }, [parar])

  // Salir de la pantalla con el sintetizador hablando lo deja hablando: la
  // síntesis vive en el navegador, no en el componente.
  useEffect(() => () => {
    escuchaRef.current?.abortar()
    locutorRef.current?.cancelar()
    abortoRef.current?.abort()
  }, [])

  return {
    mensajes,
    parcial,
    fase,
    error,
    arrancar,
    pulsarMicro,
    escribir: responder,
    parar,
    reiniciar,
  }
}

/** El modelo casi siempre manda la forma correcta; casi no es siempre. */
function normalizar(crudo: unknown): Ficha {
  const dato = (crudo ?? {}) as Partial<Ficha>
  return {
    correccion:
      dato.correccion && typeof dato.correccion.mejor === 'string' ? dato.correccion : null,
    vocabulario: Array.isArray(dato.vocabulario)
      ? dato.vocabulario.filter((v) => v && typeof v.termino === 'string')
      : [],
    expresion: dato.expresion && typeof dato.expresion.frase === 'string' ? dato.expresion : null,
  }
}
