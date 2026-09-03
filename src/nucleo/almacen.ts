import type { Ajustes, Estado, Informe, Presupuesto, Tarjeta } from './tipos.ts'
import { PRESUPUESTO_INICIAL, renovarSiToca } from './presupuesto.ts'
import { TEMA_POR_DEFECTO } from './temas.ts'

const CLAVE = 'dontjudgeme.v1'

/** Los informes viejos no aportan y el almacenamiento del navegador es finito. */
const MAX_INFORMES = 50

const POR_DEFECTO: Estado = {
  ajustes: {
    nivel: 'B2',
    temaId: TEMA_POR_DEFECTO,
    vozPreferida: null,
    bloqueoAutomatico: false,
  },
  tarjetas: [],
  informes: [],
  presupuesto: PRESUPUESTO_INICIAL,
}

/**
 * Todo vive en el móvil. No hay cuenta, no hay servidor de datos y no hay
 * nada que perder si mañana se apaga: el cuaderno se exporta a JSON.
 *
 * Es también lo que hace que la app no necesite login: nada que proteger en
 * un servidor porque no hay servidor.
 */
export function leer(): Estado {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return POR_DEFECTO
    const guardado = JSON.parse(crudo) as Partial<Estado>
    return {
      ajustes: { ...POR_DEFECTO.ajustes, ...guardado.ajustes },
      tarjetas: Array.isArray(guardado.tarjetas) ? guardado.tarjetas : [],
      informes: Array.isArray(guardado.informes) ? guardado.informes : [],
      // El mes puede haber cambiado desde la última visita.
      presupuesto: renovarSiToca({ ...PRESUPUESTO_INICIAL, ...guardado.presupuesto }),
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

export function guardarPresupuesto(presupuesto: Presupuesto) {
  guardar({ ...leer(), presupuesto })
}

export function guardarInformes(informes: Informe[]) {
  guardar({ ...leer(), informes: informes.slice(-MAX_INFORMES) })
}

export function exportar(estado: Estado): string {
  return JSON.stringify(estado, null, 2)
}
