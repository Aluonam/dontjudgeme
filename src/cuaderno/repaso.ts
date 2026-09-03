import type { Tarjeta, Tema } from '../nucleo/tipos.ts'

const DIA = 24 * 60 * 60 * 1000

/**
 * Leitner: cinco cajas y un calendario que se estira con cada acierto.
 * La caja 5 vuelve a los tres meses, que para una expresión que ya usas
 * sola es más que suficiente.
 */
const ESPERA = [0, 1 * DIA, 3 * DIA, 7 * DIA, 21 * DIA, 90 * DIA]

/**
 * El vocabulario de un tema entra en el cuaderno cuando terminas de hablarlo,
 * no antes: repasar a ciegas palabras que todavía no has necesitado es
 * justamente el estudio que no se pega.
 */
export function tarjetasDeTema(tema: Tema, ahora = Date.now()): Tarjeta[] {
  const nuevas: Tarjeta[] = []

  for (const vocablo of tema.vocabulario) {
    nuevas.push(crear('palabra', vocablo, tema.id, ahora))
  }

  for (const expresion of tema.expresiones) {
    nuevas.push(
      crear(
        expresion.tipo,
        { termino: expresion.frase, significado: expresion.significado, ejemplo: expresion.ejemplo },
        tema.id,
        ahora,
      ),
    )
  }

  return nuevas
}

function crear(
  tipo: Tarjeta['tipo'],
  contenido: { termino: string; significado: string; ejemplo: string },
  temaId: string,
  ahora: number,
): Tarjeta {
  return {
    id: crypto.randomUUID(),
    tipo,
    termino: contenido.termino.trim(),
    significado: (contenido.significado ?? '').trim(),
    ejemplo: (contenido.ejemplo ?? '').trim(),
    temaId,
    caja: 1,
    // Nace vencida: si acabas de usarla hablando, hoy es el mejor día para verla.
    proximo: ahora,
    creada: ahora,
  }
}

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, '')
    .trim()

/** Los temas comparten expresiones; el cuaderno no debe repetirlas. */
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
