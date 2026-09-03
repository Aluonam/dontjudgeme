/**
 * El micrófono. Envuelve la Web Speech API del navegador.
 *
 * Se reconoce en local, en el propio navegador: no sube audio a ningún sitio
 * y no cuesta nada. A cambio solo existe en Chrome y Edge (escritorio y
 * Android); en Safari, `soportado` es false y la app ofrece escribir.
 *
 * Funciona como una nota de voz de WhatsApp: se abre al pulsar y NO se cierra
 * sola. Que decida el navegador cuándo has terminado de hablar es cómodo para
 * dictar la lista de la compra y pésimo para practicar un idioma, donde
 * pararse tres segundos a buscar una palabra es exactamente lo que pasa. Aquí
 * el turno se cierra cuando tú sueltas.
 *
 * Todo el resto de la app habla con esta interfaz, así que cambiar a un
 * servicio de voz de verdad es reescribir este archivo y nada más.
 */

interface Alternativa {
  transcript: string
}

interface ResultadoVoz {
  isFinal: boolean
  0: Alternativa
}

interface EventoResultado {
  resultIndex: number
  results: ArrayLike<ResultadoVoz>
}

interface Reconocedor {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((evento: EventoResultado) => void) | null
  onend: (() => void) | null
  onerror: ((evento: { error: string }) => void) | null
}

type ConstructorReconocedor = new () => Reconocedor

function constructor(): ConstructorReconocedor | null {
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor
    webkitSpeechRecognition?: ConstructorReconocedor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const RECONOCIMIENTO_SOPORTADO = typeof window !== 'undefined' && constructor() !== null

export interface Escucha {
  empezar(): void
  /** Sueltas el botón: cierra el turno y entrega lo dicho. */
  soltar(): void
  /** Deslizas para cancelar: cierra y tira lo dicho. */
  cancelar(): void
  grabando(): boolean
}

export interface AvisosEscucha {
  /** Todo lo dicho hasta ahora, cerrado y provisional. Es la transcripción en vivo. */
  alParcial(texto: string): void
  /** Al soltar, si había algo que decir. */
  alEntregar(texto: string): void
  alCancelar(): void
  alFallar(mensaje: string): void
}

const MOTIVOS: Record<string, string> = {
  'audio-capture': 'No encuentro el micrófono.',
  'not-allowed': 'El navegador ha bloqueado el micrófono. Dale permiso y recarga.',
  network: 'El reconocimiento de voz necesita conexión.',
}

export function crearEscucha(avisos: AvisosEscucha): Escucha {
  const Motor = constructor()
  if (!Motor) {
    return {
      empezar: () => avisos.alFallar('Este navegador no reconoce voz.'),
      soltar: () => {},
      cancelar: () => {},
      grabando: () => false,
    }
  }

  const motor = new Motor()
  motor.lang = 'en-US'
  // Continuo: la frase no se cierra por callarte un momento.
  motor.continuous = true
  motor.interimResults = true
  motor.maxAlternatives = 1

  /** Lo que ya ha dado por definitivo, acumulado a lo largo del turno. */
  let cerrado = ''
  let sosteniendo = false
  let intencion: 'ninguna' | 'entregar' | 'cancelar' = 'ninguna'

  motor.onresult = (evento) => {
    let provisional = ''
    for (let i = evento.resultIndex; i < evento.results.length; i++) {
      const resultado = evento.results[i]
      if (resultado.isFinal) cerrado += resultado[0].transcript
      else provisional += resultado[0].transcript
    }
    avisos.alParcial((cerrado + provisional).trim())
  }

  motor.onerror = (evento) => {
    // "aborted" es lo que pasa cuando cortamos nosotros, y "no-speech" salta
    // sola en los silencios largos. Ninguna de las dos es un fallo del que
    // haya que avisar: llenarían la pantalla de errores falsos.
    if (evento.error === 'aborted' || evento.error === 'no-speech') return
    sosteniendo = false
    avisos.alFallar(MOTIVOS[evento.error] ?? 'El micrófono ha fallado.')
  }

  motor.onend = () => {
    // Chrome corta la sesión por su cuenta tras unos segundos de silencio,
    // aunque `continuous` esté puesto. Mientras el botón siga pulsado eso no
    // es el final del turno: se rearranca y se sigue acumulando.
    if (sosteniendo) {
      try {
        motor.start()
        return
      } catch {
        // Si no deja rearrancar, se cierra el turno con lo que haya.
      }
    }

    sosteniendo = false
    const dicho = cerrado.trim()
    cerrado = ''

    if (intencion === 'cancelar') avisos.alCancelar()
    else if (dicho) avisos.alEntregar(dicho)
    else avisos.alCancelar()

    intencion = 'ninguna'
    avisos.alParcial('')
  }

  return {
    empezar() {
      if (sosteniendo) return
      cerrado = ''
      intencion = 'ninguna'
      sosteniendo = true
      try {
        motor.start()
      } catch {
        // Chrome lanza si ya estaba arrancando. onend llegará igual.
        sosteniendo = false
      }
    },
    soltar() {
      if (!sosteniendo) return
      intencion = 'entregar'
      sosteniendo = false
      motor.stop()
    },
    cancelar() {
      intencion = 'cancelar'
      sosteniendo = false
      motor.abort()
    },
    grabando: () => sosteniendo,
  }
}
