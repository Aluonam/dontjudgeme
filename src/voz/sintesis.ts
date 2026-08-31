/**
 * La voz del tutor. Habla mientras el modelo todavía está escribiendo.
 *
 * Ese es el truco de toda la app: si esperásemos a la respuesta completa
 * habría dos o tres segundos de silencio en cada turno y dejaría de parecer
 * una conversación. En vez de eso vamos empujando el texto según llega y
 * cortando por frases: en cuanto hay un punto, esa frase ya se está diciendo.
 */

export const SINTESIS_SOPORTADA = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Un punto, interrogación o exclamación seguido de espacio cierra frase. */
const FIN_DE_FRASE = /[.!?…]["')\]]?\s/

export function vocesInglesas(): SpeechSynthesisVoice[] {
  if (!SINTESIS_SOPORTADA) return []
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'))
}

/**
 * Las voces llegan tarde en Chrome: la primera llamada a getVoices() suele
 * devolver una lista vacía y hay que esperar al evento.
 */
export function alCargarVoces(callback: () => void): () => void {
  if (!SINTESIS_SOPORTADA) return () => {}
  speechSynthesis.addEventListener('voiceschanged', callback)
  return () => speechSynthesis.removeEventListener('voiceschanged', callback)
}

export function elegirVoz(preferida: string | null): SpeechSynthesisVoice | null {
  const voces = vocesInglesas()
  if (!voces.length) return null
  if (preferida) {
    const guardada = voces.find((v) => v.name === preferida)
    if (guardada) return guardada
  }
  // Sin preferencia, británica: el tutor es de Bristol.
  return voces.find((v) => v.lang === 'en-GB') ?? voces[0]
}

/** Decir una frase suelta: el altavoz de una tarjeta del cuaderno. */
export function pronunciar(texto: string, voz: SpeechSynthesisVoice | null) {
  if (!SINTESIS_SOPORTADA || !texto.trim()) return
  speechSynthesis.cancel()
  const locucion = new SpeechSynthesisUtterance(texto)
  if (voz) locucion.voice = voz
  locucion.lang = voz?.lang ?? 'en-GB'
  speechSynthesis.speak(locucion)
}

export interface Locutor {
  /** Añade un trozo de texto recién llegado del modelo. */
  empujar(fragmento: string): void
  /** Ya no viene más texto: di lo que quede pendiente. */
  cerrar(): void
  /** Cállate ahora mismo (te han interrumpido). */
  cancelar(): void
  hablando(): boolean
}

export function crearLocutor(opciones: {
  voz: SpeechSynthesisVoice | null
  velocidad?: number
  alEmpezar?: () => void
  /** Cuando ya no queda nada por decir. Es lo que reabre el micrófono. */
  alCallar?: () => void
}): Locutor {
  let pendiente = ''
  let cerrado = false
  let enCola = 0
  let cancelado = false
  let mantener: ReturnType<typeof setInterval> | null = null

  function decir(frase: string) {
    const limpia = frase.trim()
    if (!limpia || !SINTESIS_SOPORTADA) return

    const locucion = new SpeechSynthesisUtterance(limpia)
    if (opciones.voz) locucion.voice = opciones.voz
    locucion.lang = opciones.voz?.lang ?? 'en-GB'
    locucion.rate = opciones.velocidad ?? 1

    enCola++
    if (enCola === 1) {
      opciones.alEmpezar?.()
      // Chrome deja de hablar solo a los ~15 segundos si nadie le toca.
      // Este latido es el remedio conocido y no molesta a nadie más.
      mantener = setInterval(() => speechSynthesis.resume(), 8000)
    }

    const terminar = () => {
      enCola--
      if (enCola > 0 || !cerrado || cancelado) return
      if (mantener) clearInterval(mantener)
      mantener = null
      opciones.alCallar?.()
    }

    locucion.onend = terminar
    locucion.onerror = terminar
    speechSynthesis.speak(locucion)
  }

  function vaciar(todo: boolean) {
    if (todo) {
      decir(pendiente)
      pendiente = ''
      return
    }
    for (;;) {
      const corte = pendiente.search(FIN_DE_FRASE)
      if (corte < 0) break
      // +2 para llevarse el signo y el espacio que lo sigue.
      decir(pendiente.slice(0, corte + 2))
      pendiente = pendiente.slice(corte + 2)
    }
  }

  return {
    empujar(fragmento) {
      if (cancelado) return
      pendiente += fragmento
      vaciar(false)
    },
    cerrar() {
      if (cancelado) return
      cerrado = true
      vaciar(true)
      // El texto podía no acabar en punto, o llegar vacío: si no ha quedado
      // nada en cola, nadie iba a avisar de que ya ha terminado de hablar.
      if (enCola === 0) opciones.alCallar?.()
    },
    cancelar() {
      cancelado = true
      cerrado = true
      pendiente = ''
      enCola = 0
      if (mantener) clearInterval(mantener)
      mantener = null
      if (SINTESIS_SOPORTADA) speechSynthesis.cancel()
    },
    hablando: () => enCola > 0,
  }
}
