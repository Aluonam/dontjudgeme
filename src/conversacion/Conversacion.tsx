import { useEffect, useRef, useState } from 'react'
import type { Gasto, Informe, Mensaje, Nivel, Presupuesto, Tema } from '../nucleo/tipos.ts'
import { euros, puedeConversar } from '../nucleo/presupuesto.ts'
import { MedidorGasto } from '../nucleo/MedidorGasto.tsx'
import { RECONOCIMIENTO_SOPORTADO } from '../voz/reconocimiento.ts'
import { SINTESIS_SOPORTADA } from '../voz/sintesis.ts'
import { usarConversacion } from './usarConversacion.ts'
import { BotonVoz } from './BotonVoz.tsx'

interface Props {
  tema: Tema
  nivel: Nivel
  voz: SpeechSynthesisVoice | null
  presupuesto: Presupuesto
  erroresPrevios: string[]
  alGastar(gasto: Gasto): void
  alTerminar(informe: Informe, costeEur: number): void
  alSalir(): void
}

export function Conversacion({
  tema,
  nivel,
  voz,
  presupuesto,
  erroresPrevios,
  alGastar,
  alTerminar,
  alSalir,
}: Props) {
  const [teclado, setTeclado] = useState(!RECONOCIMIENTO_SOPORTADO)
  const [escrito, setEscrito] = useState('')
  const finRef = useRef<HTMLDivElement>(null)

  const charla = usarConversacion({
    nivel,
    tema,
    voz,
    erroresPrevios,
    hayPresupuesto: puedeConversar(presupuesto),
    alGastar,
  })

  // El primer turno del tutor está escrito, así que arranca solo: llegas a
  // esta pantalla desde el botón de "empezar a hablar", no hace falta otro.
  const arrancarRef = useRef(charla.arrancar)
  arrancarRef.current = charla.arrancar
  useEffect(() => {
    arrancarRef.current()
  }, [])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [charla.mensajes, charla.parcial])

  async function colgar() {
    const informe = await charla.colgar()
    if (informe) alTerminar(informe, charla.costeEur)
  }

  function enviarEscrito(evento: React.FormEvent) {
    evento.preventDefault()
    const texto = escrito.trim()
    if (!texto) return
    setEscrito('')
    charla.escribir(texto)
  }

  const sinPresupuesto = !puedeConversar(presupuesto)

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 space-y-2 border-b border-borde bg-panel/80 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h1 className="min-w-0 truncate text-sm font-semibold">
            {tema.emoji} {tema.titulo}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] tabular-nums text-suave">{euros(charla.costeEur)}</span>
            <button
              type="button"
              onClick={colgar}
              disabled={charla.generandoInforme}
              className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs text-red-200 disabled:opacity-50"
            >
              {charla.generandoInforme ? 'Analizando…' : 'Colgar'}
            </button>
          </div>
        </div>

        <MedidorGasto presupuesto={presupuesto} compacto />
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {charla.mensajes.map((mensaje) => (
          <Burbuja key={mensaje.id} mensaje={mensaje} pensando={charla.fase === 'pensando'} />
        ))}

        {/* La transcripción en vivo. Verla antes de enviar es lo que te salva
            cuando el micrófono ha entendido otra cosa: cancelas y repites. */}
        {charla.parcial && (
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-dashed border-acento/40 px-4 py-2.5 text-right text-suave italic">
            {charla.parcial}
          </p>
        )}

        {charla.error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {charla.error}
          </p>
        )}

        {charla.generandoInforme && (
          <p className="rounded-xl border border-borde bg-panel px-3 py-2 text-sm text-suave">
            Repasando la conversación entera…
          </p>
        )}

        <div ref={finRef} />
      </div>

      <footer className="shrink-0 border-t border-borde bg-panel px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!SINTESIS_SOPORTADA && (
          <p className="mb-2 rounded-lg border border-borde px-2 py-1.5 text-[11px] text-suave">
            Este navegador no habla en voz alta. Verás las respuestas escritas.
          </p>
        )}

        {teclado ? (
          <form onSubmit={enviarEscrito} className="flex gap-2">
            <input
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              placeholder="Type your answer…"
              lang="en"
              autoFocus
              disabled={sinPresupuesto}
              className="min-w-0 flex-1 rounded-xl border border-borde bg-panel-alto px-3 py-2.5 text-sm outline-none focus:border-acento disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={sinPresupuesto}
              className="rounded-xl bg-acento px-4 py-2.5 text-sm font-semibold text-fondo disabled:opacity-40"
            >
              Enviar
            </button>
            {RECONOCIMIENTO_SOPORTADO && (
              <button
                type="button"
                onClick={() => setTeclado(false)}
                className="rounded-xl border border-borde px-3 text-lg"
                aria-label="Volver a la voz"
              >
                🎙️
              </button>
            )}
          </form>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <button
              type="button"
              onClick={alSalir}
              className="w-14 shrink-0 pb-6 text-left text-[11px] text-suave"
            >
              ← Salir
            </button>

            <BotonVoz
              fase={charla.fase}
              deshabilitado={sinPresupuesto || charla.generandoInforme}
              alEmpezar={charla.empezarGrabacion}
              alSoltar={charla.soltarGrabacion}
              alCancelar={charla.cancelarGrabacion}
            />

            <button
              type="button"
              onClick={() => setTeclado(true)}
              className="w-14 shrink-0 pb-6 text-right text-[11px] text-suave"
            >
              ⌨️ Escribir
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}

function Burbuja({ mensaje, pensando }: { mensaje: Mensaje; pensando: boolean }) {
  if (mensaje.papel === 'yo') {
    return (
      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-panel-alto px-4 py-2.5">
        {mensaje.texto}
      </p>
    )
  }

  return (
    <p className="max-w-[90%] rounded-2xl rounded-bl-md border border-tutor/25 bg-tutor/10 px-4 py-2.5">
      {mensaje.texto || (pensando ? <Puntos /> : null)}
    </p>
  )
}

function Puntos() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Pensando">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="puntito h-1.5 w-1.5 rounded-full bg-tutor"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}
