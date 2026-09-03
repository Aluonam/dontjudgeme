import type { Gasto, Presupuesto } from './tipos.ts'

/**
 * El contador de gasto.
 *
 * La red de seguridad de verdad es el saldo prepago de Anthropic: si cargas
 * cinco euros, cinco euros es lo máximo que puede gastarse, lo diga esta app
 * o no. Esto de aquí es la otra mitad: enterarte ANTES de quedarte sin saldo
 * a mitad de una conversación.
 */

/** Dólares por millón de tokens. Claude Opus 5, tarifa de la API. */
const PRECIO_USD = {
  entrada: 5,
  salida: 25,
  /** Leer de caché cuesta un 10% de la entrada. */
  cacheLectura: 0.5,
  /** Escribir en caché, un 25% más que la entrada. */
  cacheEscritura: 6.25,
}

/** Aproximado y a propósito: es un medidor, no una factura. */
const USD_POR_EUR = 1.09

export const LIMITE_POR_DEFECTO_EUR = 5

/**
 * Lo que se reserva para el informe final. Sin esto, una conversación puede
 * agotar el presupuesto justo antes de generar lo único que de verdad
 * enseña — y te quedas sin la parte útil.
 */
export const RESERVA_INFORME_EUR = 0.05

/** Estimación de arranque, hasta que haya conversaciones reales que promediar. */
const COSTE_MEDIO_INICIAL_EUR = 0.22

export const PRESUPUESTO_INICIAL: Presupuesto = {
  limiteEur: LIMITE_POR_DEFECTO_EUR,
  gastadoEur: 0,
  desde: Date.now(),
  costeMedioEur: COSTE_MEDIO_INICIAL_EUR,
  conversaciones: 0,
}

/** Lo que devuelve la API en `usage`, tal cual. */
export interface Uso {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

export function calcularGasto(uso: Uso): Gasto {
  const entrada = uso.input_tokens ?? 0
  const salida = uso.output_tokens ?? 0
  const cacheLectura = uso.cache_read_input_tokens ?? 0
  const cacheEscritura = uso.cache_creation_input_tokens ?? 0

  const usd =
    (entrada * PRECIO_USD.entrada +
      salida * PRECIO_USD.salida +
      cacheLectura * PRECIO_USD.cacheLectura +
      cacheEscritura * PRECIO_USD.cacheEscritura) /
    1_000_000

  return { entrada, salida, cacheLectura, cacheEscritura, eur: usd / USD_POR_EUR }
}

/** El periodo es natural: el día uno de cada mes vuelve a cero. */
function mismoMes(a: number, b: number): boolean {
  const uno = new Date(a)
  const otro = new Date(b)
  return uno.getFullYear() === otro.getFullYear() && uno.getMonth() === otro.getMonth()
}

export function renovarSiToca(presupuesto: Presupuesto, ahora = Date.now()): Presupuesto {
  if (mismoMes(presupuesto.desde, ahora)) return presupuesto
  return { ...presupuesto, gastadoEur: 0, desde: ahora }
}

export function anotar(presupuesto: Presupuesto, gasto: Gasto): Presupuesto {
  return { ...presupuesto, gastadoEur: presupuesto.gastadoEur + gasto.eur }
}

/**
 * Al cerrar una conversación se recalcula el coste medio. Es lo que permite
 * decir "te quedan unas cuatro conversaciones" en vez de "te quedan 0,88 €",
 * que no significa nada para nadie.
 */
export function cerrarConversacion(presupuesto: Presupuesto, costeEur: number): Presupuesto {
  const conversaciones = presupuesto.conversaciones + 1
  const costeMedioEur =
    (presupuesto.costeMedioEur * presupuesto.conversaciones + costeEur) / conversaciones
  return { ...presupuesto, conversaciones, costeMedioEur }
}

export function restante(presupuesto: Presupuesto): number {
  return Math.max(0, presupuesto.limiteEur - presupuesto.gastadoEur)
}

export function fraccion(presupuesto: Presupuesto): number {
  if (presupuesto.limiteEur <= 0) return 1
  return Math.min(1, presupuesto.gastadoEur / presupuesto.limiteEur)
}

/** Cuántas conversaciones completas caben en lo que queda. */
export function conversacionesRestantes(presupuesto: Presupuesto): number {
  const medio = Math.max(presupuesto.costeMedioEur, 0.01)
  return Math.floor(restante(presupuesto) / medio)
}

export type Nivel_Aviso = 'tranquilo' | 'mitad' | 'alto' | 'critico' | 'agotado'

export function nivelAviso(presupuesto: Presupuesto): Nivel_Aviso {
  const parte = fraccion(presupuesto)
  if (parte >= 1) return 'agotado'
  if (parte >= 0.95) return 'critico'
  if (parte >= 0.8) return 'alto'
  if (parte >= 0.5) return 'mitad'
  return 'tranquilo'
}

/** Si no cabe otro turno más su informe, no se empieza. */
export function puedeConversar(presupuesto: Presupuesto): boolean {
  return restante(presupuesto) > RESERVA_INFORME_EUR
}

/** Queda saldo, pero no para una conversación entera: hay que avisar antes. */
export function seQuedaraCorta(presupuesto: Presupuesto): boolean {
  return puedeConversar(presupuesto) && restante(presupuesto) < presupuesto.costeMedioEur
}

export function euros(cantidad: number): string {
  return cantidad.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })
}
