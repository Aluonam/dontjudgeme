export type Nivel = 'A2' | 'B1' | 'B2' | 'C1'

export const NIVELES: { id: Nivel; etiqueta: string }[] = [
  { id: 'A2', etiqueta: 'A2 · me defiendo' },
  { id: 'B1', etiqueta: 'B1 · voy tirando' },
  { id: 'B2', etiqueta: 'B2 · con soltura' },
  { id: 'C1', etiqueta: 'C1 · casi nativa' },
]

export interface Situacion {
  id: string
  emoji: string
  titulo: string
  /** Lo que ve el modelo: en inglés, porque es parte de sus instrucciones. */
  descripcion: string
  /** Primera frase del tutor. Escrita a mano para arrancar sin esperar a la API. */
  arranque: string
}

export type Papel = 'yo' | 'tutor'

export interface Mensaje {
  id: string
  papel: Papel
  texto: string
  /** Se rellena cuando termina el turno; es lo que pinta la ficha del profesor. */
  ficha?: Ficha
}

export interface Correccion {
  original: string
  mejor: string
  porque: string
}

export interface Vocablo {
  termino: string
  significado: string
  ejemplo: string
}

export type TipoExpresion = 'idiom' | 'phrasal' | 'refran'

export interface Expresion {
  frase: string
  tipo: TipoExpresion
  significado: string
  ejemplo: string
}

/** Lo que el tutor apunta al margen de lo que dice en voz alta. */
export interface Ficha {
  correccion: Correccion | null
  vocabulario: Vocablo[]
  expresion: Expresion | null
}

export type TipoTarjeta = 'palabra' | TipoExpresion

/**
 * Una entrada del cuaderno. `caja` y `proximo` son todo el sistema de repaso:
 * cada acierto sube de caja y aleja la próxima revisión, cada fallo devuelve
 * la tarjeta a la caja uno. Es Leitner, que cabe en dos números y funciona.
 */
export interface Tarjeta {
  id: string
  tipo: TipoTarjeta
  termino: string
  significado: string
  ejemplo: string
  caja: number
  proximo: number
  creada: number
}

export interface Ajustes {
  nivel: Nivel
  situacion: string
  /** Encadenar turnos sin tocar el micro. Es lo que la hace parecer una llamada. */
  manosLibres: boolean
  vozPreferida: string | null
}

export interface Estado {
  ajustes: Ajustes
  tarjetas: Tarjeta[]
}
