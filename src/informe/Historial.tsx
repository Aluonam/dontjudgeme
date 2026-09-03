import { useMemo, useState } from 'react'
import type { Informe } from '../nucleo/tipos.ts'
import { CuerpoInforme } from './InformeFinal.tsx'
import { erroresRecurrentes } from './recurrentes.ts'

/**
 * Los informes anteriores.
 *
 * El valor de guardarlos no es poder releerlos, es ver si los mismos fallos
 * siguen ahí tres semanas después. Por eso lo primero que se ve no es la
 * lista sino lo que se repite.
 */
export function Historial({
  informes,
  voz,
}: {
  informes: Informe[]
  voz: SpeechSynthesisVoice | null
}) {
  const [abierto, setAbierto] = useState<string | null>(null)

  const recientes = useMemo(() => [...informes].reverse(), [informes])
  const recurrentes = useMemo(() => erroresRecurrentes(informes), [informes])

  const seleccionado = recientes.find((i) => i.id === abierto)

  if (seleccionado) {
    return (
      <div className="flex h-full flex-col">
        <header className="shrink-0 border-b border-borde bg-panel/80 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
          <button type="button" onClick={() => setAbierto(null)} className="text-xs text-suave">
            ← Todos los informes
          </button>
          <h2 className="mt-1 text-base font-semibold">{seleccionado.temaTitulo}</h2>
          <p className="text-xs text-suave">
            {fecha(seleccionado.fecha)} · {seleccionado.turnos} turnos
          </p>
        </header>
        <CuerpoInforme informe={seleccionado} voz={voz} />
      </div>
    )
  }

  if (!informes.length) {
    return (
      <div className="px-6 py-16 text-center text-sm text-suave">
        Aquí se irán guardando los informes de cada conversación. Todavía no hay ninguno.
      </div>
    )
  }

  return (
    <div className="space-y-5 px-3 py-4">
      {recurrentes.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide text-suave uppercase">
            Lo que se te repite
          </h3>
          <ul className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            {recurrentes.map((error) => (
              <li key={error} className="text-sm text-amber-100">
                {error}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-suave">
            La profesora ya lo sabe: monta situaciones donde vuelva a salir, sin decírtelo.
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-suave uppercase">
          {informes.length} {informes.length === 1 ? 'conversación' : 'conversaciones'}
        </h3>

        <div className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-panel">
          {recientes.map((informe) => {
            const total = informe.usadas.length + informe.noUsadas.length

            return (
              <button
                key={informe.id}
                type="button"
                onClick={() => setAbierto(informe.id)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors active:bg-panel-alto"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{informe.temaTitulo}</span>
                  <span className="block text-[11px] text-suave">{fecha(informe.fecha)}</span>
                </span>

                <span className="shrink-0 text-right text-[11px]">
                  <span className="block text-suave">
                    {informe.fallos.length} {informe.fallos.length === 1 ? 'fallo' : 'fallos'}
                  </span>
                  {total > 0 && (
                    <span className="block text-acento">
                      {informe.usadas.length}/{total} usados
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function fecha(marca: number): string {
  return new Date(marca).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
