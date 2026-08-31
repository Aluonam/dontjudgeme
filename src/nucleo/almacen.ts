import type { Ajustes, Estado, Tarjeta } from './tipos.ts'

const CLAVE = 'speakup.v1'

const POR_DEFECTO: Estado = {
  ajustes: { nivel: 'B1', situacion: 'charla', manosLibres: true, vozPreferida: null },
  tarjetas: [],
}

/**
 * Todo vive en el móvil. No hay cuenta, no hay servidor de datos y no hay
 * nada que perder si mañana se apaga: el cuaderno se exporta a JSON.
 */
export function leer(): Estado {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return POR_DEFECTO
    const guardado = JSON.parse(crudo) as Partial<Estado>
    return {
      ajustes: { ...POR_DEFECTO.ajustes, ...guardado.ajustes },
      tarjetas: Array.isArray(guardado.tarjetas) ? guardado.tarjetas : [],
    }
  } catch {
    // Modo incógnito, almacenamiento lleno o un JSON de una versión vieja.
    // Empezar de cero es mejor que no arrancar.
    return POR_DEFECTO
  }
}

export function guardar(estado: Estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    // Sin almacenamiento la app sigue funcionando; solo no recuerda.
  }
}

export function guardarAjustes(ajustes: Ajustes) {
  guardar({ ...leer(), ajustes })
}

export function guardarTarjetas(tarjetas: Tarjeta[]) {
  guardar({ ...leer(), tarjetas })
}

export function exportar(estado: Estado): string {
  return JSON.stringify(estado, null, 2)
}
