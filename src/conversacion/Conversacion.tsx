import { useEffect, useRef, useState } from 'react'
import type { Ajustes, Ficha, Mensaje, Situacion } from '../nucleo/tipos.ts'
import { NIVELES } from '../nucleo/tipos.ts'
import { SITUACIONES } from '../nucleo/escenarios.ts'
import { RECONOCIMIENTO_SOPORTADO } from '../voz/reconocimiento.ts'
import { SINTESIS_SOPORTADA } from '../voz/sintesis.ts'
import { usarConversacion } from './usarConversacion.ts'

interface Props {
  ajustes: Ajustes
  situacion: Situacion
  voz: SpeechSynthesisVoice | null
  alAprender(ficha: Ficha): void
  alCambiar(cambio: Partial<Ajustes>): void
}

const PIE: Record<string, string> = {
  reposo: 'Toca para hablar',
  escuchando: 'Te escucho…',
  pensando: 'Pensando…',
  hablando: 'Toca para interrumpir',
}

export function Conversacion({ ajustes, situacion, voz, alAprender, alCambiar }: Props) {
  const [teclado, setTeclado] = useState(!RECONOCIMIENTO_SOPORTADO)

  const charla = usarConversacion({
    nivel: ajustes.nivel,
    situacion,
    // Escribiendo, abrir el micrófono solo porque el tutor ha terminado de
    // hablar es justo lo contrario de lo que estás pidiendo.
    manosLibres: ajustes.manosLibres && !teclado,
    voz,
    alAprender,
  })

  const [escrito, setEscrito] = useState('')
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [charla.mensajes, charla.parcial])

  const empezada = charla.mensajes.length > 0

  function enviarEscrito(evento: React.FormEvent) {
    evento.preventDefault()
    const texto = escrito.trim()
    if (!texto) return
    setEscrito('')
    charla.escribir(texto)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-borde bg-panel/80 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2 pb-2">
          <h1 className="text-sm font-semibold">
            {situacion.emoji} {situacion.titulo}
          </h1>
          <div className="flex items-center gap-2">
            <select
              value={ajustes.nivel}
              onChange={(e) => alCambiar({ nivel: e.target.value as Ajustes['nivel'] })}
              className="rounded-lg border border-borde bg-panel-alto px-2 py-1 text-xs text-suave"
            >
              {NIVELES.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.etiqueta}
                </option>
              ))}
            </select>
            {empezada && (
              <button
                type="button"
                onClick={charla.reiniciar}
                className="rounded-lg border border-borde px-2 py-1 text-xs text-suave"
              >
                Reiniciar
              </button>
            )}
          </div>
        </div>

        {!empezada && (
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
            {SITUACIONES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => alCambiar({ situacion: s.id })}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                  s.id === situacion.id
                    ? 'border-acento bg-acento/15 text-acento'
                    : 'border-borde text-suave'
                }`}
              >
                {s.emoji} {s.titulo}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {!empezada && <Portada situacion={situacion} alEmpezar={charla.arrancar} />}

        {charla.mensajes.map((mensaje) => (
          <Burbuja key={mensaje.id} mensaje={mensaje} pensando={charla.fase === 'pensando'} />
        ))}

        {charla.parcial && (
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-dashed border-borde px-4 py-2.5 text-right text-suave italic">
            {charla.parcial}
          </p>
        )}

        {charla.error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {charla.error}
          </p>
        )}

        <div ref={finRef} />
      </div>

      {empezada && (
        <footer className="shrink-0 border-t border-borde bg-panel px-4 pt-3 pb-4">
          {teclado ? (
            <form onSubmit={enviarEscrito} className="flex gap-2">
              <input
                value={escrito}
                onChange={(e) => setEscrito(e.target.value)}
                placeholder="Type your answer…"
                lang="en"
                autoFocus
                className="min-w-0 flex-1 rounded-xl border border-borde bg-panel-alto px-3 py-2.5 text-sm outline-none focus:border-acento"
              />
              <button
                type="submit"
                className="rounded-xl bg-acento px-4 py-2.5 text-sm font-semibold text-fondo"
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
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => alCambiar({ manosLibres: !ajustes.manosLibres })}
                className={`w-16 shrink-0 text-left text-[11px] leading-tight ${
                  ajustes.manosLibres ? 'text-tutor' : 'text-suave'
                }`}
              >
                {ajustes.manosLibres ? '⚡ Manos libres' : '✋ Turno a turno'}
              </button>

              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={charla.pulsarMicro}
                  aria-label={PIE[charla.fase]}
                  className={`flex h-18 w-18 items-center justify-center rounded-full text-3xl transition-transform active:scale-95 ${
                    charla.fase === 'escuchando'
                      ? 'latido bg-acento text-fondo'
                      : charla.fase === 'hablando'
                        ? 'bg-tutor/20 text-tutor'
                        : 'bg-panel-alto text-texto'
                  }`}
                >
                  {charla.fase === 'hablando' ? '🔊' : '🎙️'}
                </button>
                <span className="text-[11px] text-suave">{PIE[charla.fase]}</span>
              </div>

              <button
                type="button"
                onClick={() => setTeclado(true)}
                className="w-16 shrink-0 text-right text-[11px] text-suave"
              >
                ⌨️ Escribir
              </button>
            </div>
          )}
        </footer>
      )}
    </div>
  )
}

function Portada({ situacion, alEmpezar }: { situacion: Situacion; alEmpezar(): void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
      <span className="text-6xl">{situacion.emoji}</span>
      <p className="max-w-xs text-sm text-suave">
        Vas a hablar en inglés en voz alta. Contesta como puedas: al final de cada turno te apunto
        lo que dirías mejor y las expresiones que salgan.
      </p>

      <button
        type="button"
        onClick={alEmpezar}
        className="rounded-full bg-acento px-8 py-3.5 font-semibold text-fondo"
      >
        Empezar la conversación
      </button>

      {!SINTESIS_SOPORTADA && (
        <Aviso>Este navegador no habla en voz alta. Verás las respuestas escritas.</Aviso>
      )}
      {!RECONOCIMIENTO_SOPORTADO && (
        <Aviso>
          Este navegador no reconoce voz (Safari y Firefox todavía no). Puedes escribir, o abrir la
          app en Chrome o Edge para hablar.
        </Aviso>
      )}
    </div>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-xs rounded-xl border border-borde bg-panel px-3 py-2 text-xs text-suave">
      {children}
    </p>
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
    <div className="max-w-[90%] space-y-2">
      <p className="rounded-2xl rounded-bl-md border border-tutor/25 bg-tutor/10 px-4 py-2.5">
        {mensaje.texto || (pensando ? <Puntos /> : null)}
      </p>
      {mensaje.ficha && <FichaProfesor ficha={mensaje.ficha} />}
    </div>
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

/**
 * Lo que el tutor apunta al margen. Va debajo de la burbuja y en pequeño a
 * propósito: mientras hablas no debe robarte la atención, pero está ahí
 * cuando repasas la conversación después.
 */
function FichaProfesor({ ficha }: { ficha: Ficha }) {
  const vacia = !ficha.correccion && !ficha.expresion && ficha.vocabulario.length === 0
  if (vacia) return null

  return (
    <div className="space-y-2 rounded-xl border border-borde bg-panel px-3 py-2.5 text-xs">
      {ficha.correccion && (
        <div>
          <p className="text-suave line-through">{ficha.correccion.original}</p>
          <p className="font-semibold text-acento">{ficha.correccion.mejor}</p>
          <p className="text-suave">{ficha.correccion.porque}</p>
        </div>
      )}

      {ficha.expresion && (
        <div className="border-t border-borde pt-2 first:border-0 first:pt-0">
          <p className="font-semibold text-tutor">{ficha.expresion.frase}</p>
          <p className="text-suave">{ficha.expresion.significado}</p>
        </div>
      )}

      {ficha.vocabulario.map((vocablo) => (
        <div
          key={vocablo.termino}
          className="border-t border-borde pt-2 first:border-0 first:pt-0"
        >
          <p className="font-semibold">{vocablo.termino}</p>
          <p className="text-suave">{vocablo.significado}</p>
        </div>
      ))}

      <p className="pt-1 text-[10px] text-suave/70">Guardado en el cuaderno</p>
    </div>
  )
}
