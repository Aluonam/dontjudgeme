import type { Nivel, Tema } from '../nucleo/tipos.ts'
import { CATEGORIAS, FUNCIONES, NIVELES } from '../nucleo/tipos.ts'
import { TEMAS } from '../nucleo/temas.ts'

/**
 * Elegir de qué hablar. Los temas van agrupados por categoría porque no es lo
 * mismo lo que te apetece un domingo que lo que necesitas antes de una
 * reunión con un cliente.
 */
export function SelectorTemas({
  nivel,
  alElegir,
  alCambiarNivel,
}: {
  nivel: Nivel
  alElegir(tema: Tema): void
  alCambiarNivel(nivel: Nivel): void
}) {
  return (
    <div className="space-y-6 px-3 py-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">¿De qué hablamos hoy?</h2>
        <p className="text-sm text-suave">
          Repasas el vocabulario, hablas, y al colgar te digo qué mejorar.
        </p>
      </div>

      <label className="flex items-center gap-2 text-xs text-suave">
        Tu nivel
        <select
          value={nivel}
          onChange={(e) => alCambiarNivel(e.target.value as Nivel)}
          className="rounded-lg border border-borde bg-panel-alto px-2 py-1 text-xs text-texto"
        >
          {NIVELES.map((n) => (
            <option key={n.id} value={n.id}>
              {n.etiqueta}
            </option>
          ))}
        </select>
      </label>

      {CATEGORIAS.map((categoria) => {
        const temas = TEMAS.filter((t) => t.categoria === categoria.id)
        if (!temas.length) return null

        return (
          <section key={categoria.id} className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wide text-suave uppercase">
              {categoria.etiqueta}
            </h3>
            <div className="grid gap-2">
              {temas.map((tema) => (
                <TarjetaTema key={tema.id} tema={tema} alElegir={() => alElegir(tema)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TarjetaTema({ tema, alElegir }: { tema: Tema; alElegir(): void }) {
  const cuantos = tema.vocabulario.length + tema.expresiones.length

  return (
    <button
      type="button"
      onClick={alElegir}
      className="flex w-full items-center gap-3 rounded-xl border border-borde bg-panel px-3 py-3 text-left transition-colors hover:border-acento/50"
    >
      <span className="text-2xl leading-none">{tema.emoji}</span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{tema.titulo}</span>
        <span className="block truncate text-xs text-suave">
          {tema.funciones.map((f) => FUNCIONES[f]).join(' · ')}
        </span>
      </span>

      <span className="shrink-0 text-right text-[10px] text-suave">
        <span className="block rounded-full border border-borde px-1.5 py-0.5">{tema.nivel}</span>
        <span className="mt-1 block">{cuantos} términos</span>
      </span>
    </button>
  )
}
