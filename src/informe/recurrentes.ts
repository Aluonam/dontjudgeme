import type { Informe } from '../nucleo/tipos.ts'

/** Cuántos informes hacia atrás se miran. Más allá ya no es tu inglés de hoy. */
const VENTANA = 6

/** Con menos de esto no hay patrón, hay casualidad. */
const MINIMO_REPETICIONES = 2

const MAXIMO = 8

/**
 * Lo que fallas una y otra vez.
 *
 * Se le pasa al tutor antes de empezar para que monte situaciones donde eso
 * vuelva a salir. No para que te corrija —eso sigue sin pasar durante la
 * conversación— sino para que te dé otra oportunidad de decirlo bien sin que
 * te des cuenta de que te la está dando.
 */
export function erroresRecurrentes(informes: Informe[]): string[] {
  const recientes = informes.slice(-VENTANA)
  if (!recientes.length) return []

  const cuenta = new Map<string, { veces: number; texto: string }>()

  for (const informe of recientes) {
    for (const fallo of informe.fallos) {
      const clave = fallo.mejor.toLowerCase().trim()
      if (!clave) continue
      const previo = cuenta.get(clave)
      if (previo) previo.veces++
      else cuenta.set(clave, { veces: 1, texto: `${fallo.mejor} (en vez de "${fallo.dijiste}")` })
    }
  }

  const repetidos = [...cuenta.values()]
    .filter((e) => e.veces >= MINIMO_REPETICIONES)
    .sort((a, b) => b.veces - a.veces)
    .slice(0, MAXIMO)
    .map((e) => e.texto)

  // Al principio no hay repeticiones todavía. Los fallos del último informe
  // son mejor pista que nada.
  if (repetidos.length) return repetidos
  return recientes[recientes.length - 1].fallos.slice(0, 3).map((f) => `${f.mejor} (en vez de "${f.dijiste}")`)
}
