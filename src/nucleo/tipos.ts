export type Nivel = 'A2' | 'B1' | 'B2' | 'C1'

export const NIVELES: { id: Nivel; etiqueta: string }[] = [
  { id: 'A2', etiqueta: 'A2 · me defiendo' },
  { id: 'B1', etiqueta: 'B1 · voy tirando' },
  { id: 'B2', etiqueta: 'B2 · con soltura' },
  { id: 'C1', etiqueta: 'C1 · casi nativa' },
]

/**
 * De qué va el tema. Solo sirve para agrupar la lista en pantalla: al modelo
 * le da igual, lo que él lee es la descripción y las funciones.
 */
export type Categoria = 'dia-a-dia' | 'opinion' | 'narrar' | 'trabajo' | 'puente' | 'curiosidad'

export const CATEGORIAS: { id: Categoria; etiqueta: string }[] = [
  { id: 'dia-a-dia', etiqueta: 'Día a día' },
  { id: 'opinion', etiqueta: 'Opinión y debate' },
  { id: 'narrar', etiqueta: 'Contar y suponer' },
  { id: 'trabajo', etiqueta: 'Trabajo' },
  { id: 'puente', etiqueta: 'Social en el trabajo' },
  { id: 'curiosidad', etiqueta: 'Curiosidad' },
]

/**
 * Lo que de verdad se entrena. El vocabulario del tema es la excusa: la
 * fluidez B2 es poder opinar, matizar o discrepar sin quedarte parada,
 * hables de series o de una retrospectiva.
 */
export type Funcion =
  | 'opinar'
  | 'narrar'
  | 'especular'
  | 'comparar'
  | 'matizar'
  | 'discrepar'
  | 'describir'
  | 'negociar'
  | 'recomendar'
  | 'explicar'

export const FUNCIONES: Record<Funcion, string> = {
  opinar: 'dar tu opinión y defenderla',
  narrar: 'contar algo que pasó',
  especular: 'hablar de lo hipotético',
  comparar: 'contrastar dos cosas',
  matizar: 'suavizar y precisar',
  discrepar: 'llevar la contraria con educación',
  describir: 'describir sin saber la palabra exacta',
  negociar: 'pedir, ceder y llegar a un acuerdo',
  recomendar: 'aconsejar y justificar',
  explicar: 'explicar algo técnico a quien no lo es',
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

/**
 * Un tema es a la vez el mazo que repasas antes y el guion de la
 * conversación. Fusionar las dos cosas es lo que convierte el repaso en
 * preparación de algo que vas a hacer en cinco minutos.
 */
export interface Tema {
  id: string
  emoji: string
  titulo: string
  categoria: Categoria
  nivel: Nivel
  funciones: Funcion[]
  /** Lo que ve el modelo: en inglés, porque es parte de sus instrucciones. */
  descripcion: string
  /** Primera frase del tutor. Escrita a mano para arrancar sin esperar a la API. */
  arranque: string
  vocabulario: Vocablo[]
  expresiones: Expresion[]
}

export type Papel = 'yo' | 'tutor'

export interface Mensaje {
  id: string
  papel: Papel
  texto: string
}

/* ── El informe ────────────────────────────────────────────────────────── */

export type TipoFallo = 'gramatica' | 'vocabulario' | 'calco' | 'registro'

export const TIPOS_FALLO: Record<TipoFallo, string> = {
  gramatica: 'Gramática',
  vocabulario: 'Vocabulario',
  calco: 'Calco del español',
  registro: 'Registro',
}

export interface Fallo {
  dijiste: string
  mejor: string
  porque: string
  tipo: TipoFallo
}

export interface Mejora {
  dijiste: string
  masNatural: string
  porque: string
}

/**
 * Lo que llega al colgar. No genera tarjetas: es un documento que se lee y
 * se guarda, y su valor está en poder comparar el de hoy con el de hace un
 * mes y ver si los mismos fallos siguen ahí.
 */
export interface Informe {
  id: string
  temaId: string
  temaTitulo: string
  fecha: number
  turnos: number
  duracionMs: number
  fallos: Fallo[]
  mejoras: Mejora[]
  aciertos: string[]
  /** Términos del tema que llegaste a usar, y los que se quedaron fuera. */
  usadas: string[]
  noUsadas: string[]
}

/* ── El cuaderno ───────────────────────────────────────────────────────── */

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
  /** De qué tema salió, para poder repasar solo lo de un tema. */
  temaId: string
  caja: number
  proximo: number
  creada: number
}

/* ── El gasto ──────────────────────────────────────────────────────────── */

/** Lo que ha costado una llamada. Los tokens vienen del `usage` de la API. */
export interface Gasto {
  entrada: number
  salida: number
  cacheLectura: number
  cacheEscritura: number
  eur: number
}

export interface Presupuesto {
  limiteEur: number
  gastadoEur: number
  /** Inicio del periodo en curso. Se renueva solo al cambiar de mes. */
  desde: number
  /** Media de coste por conversación, para traducir euros a algo entendible. */
  costeMedioEur: number
  conversaciones: number
}

/* ── Estado ────────────────────────────────────────────────────────────── */

export interface Ajustes {
  nivel: Nivel
  temaId: string
  vozPreferida: string | null
  /** Deslizar arriba deja el micro abierto sin mantener pulsado. */
  bloqueoAutomatico: boolean
}

export interface Estado {
  ajustes: Ajustes
  tarjetas: Tarjeta[]
  informes: Informe[]
  presupuesto: Presupuesto
}
