import { useState } from 'react'
import type { Presupuesto, Tema } from '../nucleo/tipos.ts'
import { FUNCIONES } from '../nucleo/tipos.ts'
import { conversacionesRestantes, euros, puedeConversar, restante, seQuedaraCorta } from '../nucleo/presupuesto.ts'
import { pronunciar } from '../voz/sintesis.ts'

/**
 * El repaso previo.
 *
 * Es la mitad del método: ves el vocabulario cinco minutos antes de tener que
 * usarlo de verdad, no como deberes sueltos. Y la profesora recibe esta misma
 * lista, así que conduce la conversación para que te haga falta.
 *
 * No cuesta nada: aquí no hay ninguna llamada a la API.
 */
export function Preparacion({
  tema,
  presupuesto,
  voz,
  alEmpezar,
  alVolver,
}: {
  tema: Tema
  presupuesto: Presupuesto
  voz: SpeechSynthesisVoice | null
  alEmpezar(): void
  alVolver(): void
}) {
  const [visto, setVisto] = useState<Set<string>>(new Set())

  const total = tema.vocabulario.length + tema.expresiones.length
  const sinSaldo = !puedeConversar(presupuesto)
  const justa = seQuedaraCorta(presupuesto)

  function marcar(clave: string) {
    setVisto((previo) => new Set(previo).add(clave))
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-borde bg-panel/80 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <button type="button" onClick={alVolver} className="text-xs text-suave">
          ← Otro tema
        </button>
        <h2 className="mt-1 flex items-center gap-2 text-base font-semibold">
          <span>{tema.emoji}</span>
          {tema.titulo}
        </h2>
        <p className="mt-0.5 text-xs text-suave">
          Vas a practicar: {tema.funciones.map((f) => FUNCIONES[f]).join(', ')}
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <p className="text-xs text-suave">
          Repásalo sin prisa. Toca cualquier término para oírlo.{' '}
          <span className="text-texto">
            {visto.size} de {total}
          </span>
        </p>

        <Bloque titulo="Vocabulario">
          {tema.vocabulario.map((vocablo) => (
            <Fila
              key={vocablo.termino}
              ingles={vocablo.termino}
              espanol={vocablo.significado}
              ejemplo={vocablo.ejemplo}
              visto={visto.has(vocablo.termino)}
              alTocar={() => {
                marcar(vocablo.termino)
                pronunciar(vocablo.ejemplo || vocablo.termino, voz)
              }}
            />
          ))}
        </Bloque>

        <Bloque titulo="Expresiones">
          {tema.expresiones.map((expresion) => (
            <Fila
              key={expresion.frase}
              ingles={expresion.frase}
              espanol={expresion.significado}
              ejemplo={expresion.ejemplo}
              etiqueta={expresion.tipo}
              visto={visto.has(expresion.frase)}
              alTocar={() => {
                marcar(expresion.frase)
                pronunciar(expresion.ejemplo || expresion.frase, voz)
              }}
            />
          ))}
        </Bloque>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-borde bg-panel px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {sinSaldo ? (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            Se ha agotado el presupuesto de este mes. Puedes subirlo en Ajustes, o repasar el
            cuaderno, que no cuesta nada.
          </p>
        ) : (
          justa && (
            <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Te quedan {euros(restante(presupuesto))}. Da para una conversación corta, así que se
              cortará antes de lo normal.
            </p>
          )
        )}

        <button
          type="button"
          onClick={alEmpezar}
          disabled={sinSaldo}
          className="w-full rounded-full bg-acento py-3.5 font-semibold text-fondo disabled:opacity-40"
        >
          {justa && !sinSaldo ? 'Empezar de todos modos' : 'Empezar a hablar'}
        </button>

        {!sinSaldo && !justa && (
          <p className="text-center text-[11px] text-suave">
            Te quedan unas {conversacionesRestantes(presupuesto)} conversaciones este mes
          </p>
        )}
      </footer>
    </div>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold tracking-wide text-suave uppercase">{titulo}</h3>
      <div className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-panel">
        {children}
      </div>
    </section>
  )
}

function Fila({
  ingles,
  espanol,
  ejemplo,
  etiqueta,
  visto,
  alTocar,
}: {
  ingles: string
  espanol: string
  ejemplo: string
  etiqueta?: string
  visto: boolean
  alTocar(): void
}) {
  return (
    <button
      type="button"
      onClick={alTocar}
      className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors active:bg-panel-alto"
    >
      <span className={`mt-0.5 text-xs ${visto ? 'text-acento' : 'text-suave/40'}`}>
        {visto ? '✓' : '🔊'}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{ingles}</span>
          <span className="text-xs text-suave">{espanol}</span>
          {etiqueta && (
            <span className="rounded border border-borde px-1 text-[10px] text-suave">
              {etiqueta}
            </span>
          )}
        </span>
        {ejemplo && <span className="mt-0.5 block text-xs text-suave/80 italic">{ejemplo}</span>}
      </span>
    </button>
  )
}
