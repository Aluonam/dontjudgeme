/**
 * El micrófono. Envuelve la Web Speech API del navegador.
 *
 * Se reconoce en local, en el propio navegador: no sube audio a ningún sitio
 * y no cuesta nada. A cambio solo existe en Chrome y Edge (escritorio y
 * Android); en Safari, `soportado` es false y la app ofrece escribir.
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
  parar(): void
  abortar(): void
}

export interface AvisosEscucha {
  /** Texto provisional, para que se vea que te está oyendo. */
  alParcial(texto: string): void
  /** Lo que finalmente entendió. Puede no llegar si te callas. */
  alFinal(texto: string): void
  /** Siempre, haya habido texto o no. Aquí es donde se cierra el turno. */
  alTerminar(): void
  alFallar(mensaje: string): void
}

const MOTIVOS: Record<string, string> = {
  'no-speech': 'No te he oído. Prueba otra vez.',
  'audio-capture': 'No encuentro el micrófono.',
  'not-allowed': 'El navegador ha bloqueado el micrófono. Dale permiso y recarga.',
  network: 'El reconocimiento de voz necesita conexión.',
}

export function crearEscucha(avisos: AvisosEscucha): Escucha {
  const Motor = constructor()
  if (!Motor) {
    return { empezar: () => avisos.alFallar('Este navegador no reconoce voz.'), parar: () => {}, abortar: () => {} }
  }

  const motor = new Motor()
  motor.lang = 'en-US'
  // Un turno de conversación, no un dictado: queremos que se corte solo
  // cuando ella termina de hablar, y devolver la pelota.
  motor.continuous = false
  motor.interimResults = true
  motor.maxAlternatives = 1

  let activo = false

  motor.onresult = (evento) => {
    let parcial = ''
    for (let i = evento.resultIndex; i < evento.results.length; i++) {
      const resultado = evento.results[i]
      if (resultado.isFinal) avisos.alFinal(resultado[0].transcript.trim())
      else parcial += resultado[0].transcript
    }
    if (parcial) avisos.alParcial(parcial.trim())
  }

  motor.onerror = (evento) => {
    // "aborted" es lo que pasa cuando somos nosotros los que cortamos:
    // no es un fallo y avisar de él llenaría la pantalla de errores falsos.
    if (evento.error === 'aborted') return
    avisos.alFallar(MOTIVOS[evento.error] ?? 'El micrófono ha fallado.')
  }

  motor.onend = () => {
    activo = false
    avisos.alTerminar()
  }

  return {
    empezar() {
      if (activo) return
      activo = true
      try {
        motor.start()
      } catch {
        // Chrome lanza si ya estaba arrancando. Se ignora: onend llegará igual.
        activo = false
      }
    },
    parar() {
      if (activo) motor.stop()
    },
    abortar() {
      activo = false
      motor.abort()
    },
  }
}
