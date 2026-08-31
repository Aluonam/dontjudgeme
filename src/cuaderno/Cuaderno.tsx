import { useMemo, useState } from 'react'
import type { Tarjeta } from '../nucleo/tipos.ts'
import { calificar, pendientes } from './repaso.ts'
import { pronunciar } from '../voz/sintesis.ts'

interface Props {
  tarjetas: Tarjeta[]
  voz: SpeechSynthesisVoice | null
  alGuardar(tarjetas: Tarjeta[]): void
}

const ETIQUETA: Record<Tarjeta['tipo'], string> = {
  palabra: 'palabra',
  idiom: 'expresión',
  phrasal: 'phrasal',
  refran: 'refrán',
}

export function Cuaderno({ tarjetas, voz, alGuardar }: Props) {
  const [repasando, setRepasando] = useState(false)
  const cola = useMemo(() => pendientes(tarjetas), [tarjetas])

  if (repasando && cola.length) {
    return (
      <Repaso
        tarjeta={cola[0]}
        quedan={cola.length}
        voz={voz}
        alSalir={() => setRepasando(false)}
        alResponder={(acerto) =>
          alGuardar(tarjetas.map((t) => (t.id === cola[0].id ? calificar(t, acerto) : t)))
        }
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-borde bg-panel px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <h1 className="font-semibold">Cuaderno</h1>
        <p className="text-xs text-suave">
          {tarjetas.length} {tarjetas.length === 1 ? 'entrada' : 'entradas'} ·{' '}
          {cola.length ? `${cola.length} por repasar` : 'nada pendiente hoy'}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {cola.length > 0 && (
          <button
            type="button"
            onClick={() => setRepasando(true)}
            className="mb-4 w-full rounded-xl bg-acento py-3 font-semibold text-fondo"
          >
            Repasar {cola.length}
          </button>
        )}

        {tarjetas.length === 0 ? (
          <p className="px-2 py-12 text-center text-sm text-suave">
            Todavía no hay nada. Cada conversación va dejando aquí lo que digas mal y las
            expresiones que salgan.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...tarjetas]
              .sort((a, b) => b.creada - a.creada)
              .map((tarjeta) => (
                <li
                  key={tarjeta.id}
                  className="rounded-xl border border-borde bg-panel px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{tarjeta.termino}</p>
                      <p className="text-sm text-suave">{tarjeta.significado}</p>
                      {tarjeta.ejemplo && (
                        <p className="mt-1 text-xs text-suave/80 italic">{tarjeta.ejemplo}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => pronunciar(tarjeta.termino, voz)}
                      aria-label={`Escuchar ${tarjeta.termino}`}
                      className="shrink-0 text-lg"
                    >
                      🔊
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-suave/70">
                    <span className="rounded bg-panel-alto px-1.5 py-0.5">
                      {ETIQUETA[tarjeta.tipo]}
                    </span>
                    <span>caja {tarjeta.caja}/5</span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Una tarjeta cada vez, tapada. Enseñar primero el inglés y no la traducción
 * es lo que obliga a recordar el significado en vez de reconocerlo.
 */
function Repaso({
  tarjeta,
  quedan,
  voz,
  alResponder,
  alSalir,
}: {
  tarjeta: Tarjeta
  quedan: number
  voz: SpeechSynthesisVoice | null
  alResponder(acerto: boolean): void
  alSalir(): void
}) {
  const [destapada, setDestapada] = useState(false)

  function responder(acerto: boolean) {
    setDestapada(false)
    alResponder(acerto)
  }

  return (
    <div className="flex h-full flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6">
      <div className="flex shrink-0 items-center justify-between text-xs text-suave">
        <span>Quedan {quedan}</span>
        <button type="button" onClick={alSalir}>
          Salir
        </button>
      </div>

      <button
        type="button"
        onClick={() => setDestapada(true)}
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center"
      >
        <p className="text-2xl font-semibold">{tarjeta.termino}</p>

        {destapada ? (
          <>
            <p className="text-suave">{tarjeta.significado}</p>
            {tarjeta.ejemplo && (
              <p className="max-w-sm text-sm text-suave/80 italic">{tarjeta.ejemplo}</p>
            )}
          </>
        ) : (
          <span className="text-xs text-suave">Toca para ver el significado</span>
        )}
      </button>

      <div className="flex shrink-0 flex-col gap-3">
        <button
          type="button"
          onClick={() => pronunciar(tarjeta.ejemplo || tarjeta.termino, voz)}
          className="self-center text-xs text-suave"
        >
          🔊 Escucharlo
        </button>

        {destapada ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => responder(false)}
              className="flex-1 rounded-xl border border-borde py-3 text-sm"
            >
              No me salía
            </button>
            <button
              type="button"
              onClick={() => responder(true)}
              className="flex-1 rounded-xl bg-tutor py-3 text-sm font-semibold text-fondo"
            >
              Lo sabía
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDestapada(true)}
            className="rounded-xl bg-panel-alto py-3 text-sm"
          >
            Ver respuesta
          </button>
        )}
      </div>
    </div>
  )
}
