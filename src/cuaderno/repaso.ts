import type { Ficha, Tarjeta } from '../nucleo/tipos.ts'

const DIA = 24 * 60 * 60 * 1000

/**
 * Leitner: cinco cajas y un calendario que se estira con cada acierto.
 * La caja 5 vuelve a los tres meses, que para una expresión que ya usas
 * sola es más que suficiente.
 */
const ESPERA = [0, 1 * DIA, 3 * DIA, 7 * DIA, 21 * DIA, 90 * DIA]

export function tarjetasDeFicha(ficha: Ficha, ahora = Date.now()): Tarjeta[] {
  const nuevas: Tarjeta[] = []

  for (const vocablo of ficha.vocabulario) {
    nuevas.push(crear('palabra', vocablo.termino, vocablo.significado, vocablo.ejemplo, ahora))
  }

  if (ficha.expresion) {
    nuevas.push(
      crear(
        ficha.expresion.tipo,
        ficha.expresion.frase,
        ficha.expresion.significado,
        ficha.expresion.ejemplo,
        ahora,
      ),
    )
  }

  // La corrección también es material de repaso: lo que dijiste mal es
  // justo lo que conviene volver a ver dentro de tres días.
  if (ficha.correccion) {
    nuevas.push(
      crear(
        'palabra',
        ficha.correccion.mejor,
        ficha.correccion.porque,
        'En vez de: ' + ficha.correccion.original,
        ahora,
      ),
    )
  }

  return nuevas
}

function crear(
  tipo: Tarjeta['tipo'],
  termino: string,
  significado: string,
  ejemplo: string,
  ahora: number,
): Tarjeta {
  return {
    id: crypto.randomUUID(),
    tipo,
    termino: termino.trim(),
    significado: (significado ?? '').trim(),
    ejemplo: (ejemplo ?? '').trim(),
    caja: 1,
    // Nace vencida: si acabas de aprenderla, hoy es el mejor día para verla.
    proximo: ahora,
    creada: ahora,
  }
}

const normalizar = (texto: string) => texto.toLowerCase().replace(/[^a-z0-9' ]/g, '').trim()

/** Hablando se repiten expresiones; el cuaderno no debe repetirlas. */
export function fusionar(existentes: Tarjeta[], nuevas: Tarjeta[]): Tarjeta[] {
  const vistas = new Set(existentes.map((t) => normalizar(t.termino)))
  const acepta = nuevas.filter((t) => {
    const clave = normalizar(t.termino)
    if (!clave || vistas.has(clave)) return false
    vistas.add(clave)
    return true
  })
  return acepta.length ? [...existentes, ...acepta] : existentes
}

export function pendientes(tarjetas: Tarjeta[], ahora = Date.now()): Tarjeta[] {
  return tarjetas
    .filter((t) => t.proximo <= ahora)
    .sort((a, b) => a.proximo - b.proximo || a.creada - b.creada)
}

export function calificar(tarjeta: Tarjeta, acerto: boolean, ahora = Date.now()): Tarjeta {
  const caja = acerto ? Math.min(tarjeta.caja + 1, ESPERA.length - 1) : 1
  return { ...tarjeta, caja, proximo: ahora + ESPERA[caja] }
}
