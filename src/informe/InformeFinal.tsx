import type { Informe } from '../nucleo/tipos.ts'
import { TIPOS_FALLO } from '../nucleo/tipos.ts'
import { euros } from '../nucleo/presupuesto.ts'
import { pronunciar } from '../voz/sintesis.ts'

/**
 * El informe.
 *
 * Todo lo que no se dijo durante la conversación se dice aquí de golpe,
 * cuando ya no interrumpe nada. No genera tarjetas ni deberes: es un
 * documento que se lee, se guarda y se compara con el del mes pasado.
 */
export function InformeFinal({
  informe,
  costeEur,
  voz,
  alRepetir,
  alOtroTema,
}: {
  informe: Informe
  costeEur: number
  voz: SpeechSynthesisVoice | null
  alRepetir(): void
  alOtroTema(): void
}) {
  const minutos = Math.max(1, Math.round(informe.duracionMs / 60000))

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-borde bg-panel/80 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <h2 className="text-base font-semibold">Informe</h2>
        <p className="text-xs text-suave">
          {informe.temaTitulo} · {minutos} min · {informe.turnos} turnos ·{' '}
          <span className="tabular-nums">{euros(costeEur)}</span>
        </p>
      </header>

      <CuerpoInforme informe={informe} voz={voz} />

      <footer className="flex shrink-0 gap-2 border-t border-borde bg-panel px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={alOtroTema}
          className="flex-1 rounded-full border border-borde py-3 text-sm text-suave"
        >
          Otro tema
        </button>
        <button
          type="button"
          onClick={alRepetir}
          className="flex-1 rounded-full bg-acento py-3 text-sm font-semibold text-fondo"
        >
          Repetir tema
        </button>
      </footer>
    </div>
  )
}

/** El cuerpo del informe, compartido con el historial. */
export function CuerpoInforme({
  informe,
  voz,
}: {
  informe: Informe
  voz: SpeechSynthesisVoice | null
}) {
  const total = informe.usadas.length + informe.noUsadas.length

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {total > 0 && (
          <Seccion titulo="Vocabulario del tema">
            <div className="rounded-xl border border-borde bg-panel p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-acento tabular-nums">
                  {informe.usadas.length}
                </span>
                <span className="text-sm text-suave">de {total} términos usados</span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-alto">
                <div
                  className="h-full rounded-full bg-acento transition-all"
                  style={{ width: `${(informe.usadas.length / total) * 100}%` }}
                />
              </div>

              {informe.usadas.length > 0 && (
                <Etiquetas titulo="Usaste" items={informe.usadas} tono="acento" voz={voz} />
              )}
              {informe.noUsadas.length > 0 && (
                <Etiquetas
                  titulo="Se quedaron fuera"
                  items={informe.noUsadas}
                  tono="suave"
                  voz={voz}
                />
              )}
            </div>
          </Seccion>
        )}

        {informe.fallos.length > 0 && (
          <Seccion titulo={`Fallos (${informe.fallos.length})`}>
            <div className="space-y-2">
              {informe.fallos.map((fallo, i) => (
                <div key={i} className="rounded-xl border border-borde bg-panel p-3">
                  <p className="text-xs text-suave line-through">{fallo.dijiste}</p>
                  <button
                    type="button"
                    onClick={() => pronunciar(fallo.mejor, voz)}
                    className="mt-0.5 text-left text-sm font-semibold text-acento"
                  >
                    {fallo.mejor}
                  </button>
                  <p className="mt-1 text-xs text-suave">{fallo.porque}</p>
                  <span className="mt-2 inline-block rounded border border-borde px-1.5 py-0.5 text-[10px] text-suave">
                    {TIPOS_FALLO[fallo.tipo] ?? fallo.tipo}
                  </span>
                </div>
              ))}
            </div>
          </Seccion>
        )}

        {informe.mejoras.length > 0 && (
          <Seccion titulo="Sonaría mejor">
            <div className="space-y-2">
              {informe.mejoras.map((mejora, i) => (
                <div key={i} className="rounded-xl border border-borde bg-panel p-3">
                  <p className="text-xs text-suave">{mejora.dijiste}</p>
                  <button
                    type="button"
                    onClick={() => pronunciar(mejora.masNatural, voz)}
                    className="mt-0.5 text-left text-sm font-semibold text-tutor"
                  >
                    {mejora.masNatural}
                  </button>
                  <p className="mt-1 text-xs text-suave">{mejora.porque}</p>
                </div>
              ))}
            </div>
          </Seccion>
        )}

        {informe.aciertos.length > 0 && (
          <Seccion titulo="Lo que hiciste bien">
            <ul className="space-y-1.5 rounded-xl border border-borde bg-panel p-3">
              {informe.aciertos.map((acierto, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-acento">✓</span>
                  <span className="text-suave">{acierto}</span>
                </li>
              ))}
            </ul>
          </Seccion>
        )}

        {informe.fallos.length === 0 && informe.mejoras.length === 0 && (
          <p className="rounded-xl border border-borde bg-panel px-3 py-4 text-center text-sm text-suave">
            Sin fallos que señalar. Sube de nivel o coge un tema más difícil.
          </p>
        )}
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold tracking-wide text-suave uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

function Etiquetas({
  titulo,
  items,
  tono,
  voz,
}: {
  titulo: string
  items: string[]
  tono: 'acento' | 'suave'
  voz: SpeechSynthesisVoice | null
}) {
  return (
    <div className="mt-3">
      <p className="text-[11px] text-suave">{titulo}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => pronunciar(item, voz)}
            className={`rounded-full border px-2 py-0.5 text-[11px] ${
              tono === 'acento'
                ? 'border-acento/40 bg-acento/10 text-acento'
                : 'border-borde text-suave'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
