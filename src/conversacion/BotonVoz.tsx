import { useCallback, useEffect, useRef, useState } from 'react'
import type { FaseConversacion } from './usarConversacion.ts'

/**
 * El botón de grabar, con los gestos de una nota de voz de WhatsApp:
 * mantener para hablar, soltar para enviar, deslizar arriba para bloquear el
 * micro y hablar con las manos libres, deslizar a la izquierda para cancelar.
 *
 * Es un gesto que ya te sabes, y eso importa: la app no tiene que enseñarte a
 * usarla. En escritorio no hay dedo, así que la barra espaciadora hace de
 * botón.
 */

/** Cuánto hay que subir el dedo para bloquear, en píxeles. */
const UMBRAL_BLOQUEO = 70

/** Y cuánto hay que arrastrar a la izquierda para cancelar. */
const UMBRAL_CANCELAR = 90

interface Props {
  fase: FaseConversacion
  deshabilitado: boolean
  alEmpezar(): void
  alSoltar(): void
  alCancelar(): void
}

export function BotonVoz({ fase, deshabilitado, alEmpezar, alSoltar, alCancelar }: Props) {
  const [bloqueado, setBloqueado] = useState(false)
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 })
  const pulsandoRef = useRef(false)
  const origenRef = useRef({ x: 0, y: 0 })

  const grabando = fase === 'grabando'

  const terminarGesto = useCallback(() => {
    pulsandoRef.current = false
    setDesplazamiento({ x: 0, y: 0 })
  }, [])

  const cancelar = useCallback(() => {
    terminarGesto()
    setBloqueado(false)
    alCancelar()
  }, [alCancelar, terminarGesto])

  const enviar = useCallback(() => {
    terminarGesto()
    setBloqueado(false)
    alSoltar()
  }, [alSoltar, terminarGesto])

  /* ── Dedo ──────────────────────────────────────────────────────────── */

  function alBajar(evento: React.PointerEvent) {
    if (deshabilitado || bloqueado) return
    // Capturar el puntero mantiene los eventos aquí aunque el dedo se salga
    // del botón, que es justo lo que pasa al deslizar.
    evento.currentTarget.setPointerCapture(evento.pointerId)
    pulsandoRef.current = true
    origenRef.current = { x: evento.clientX, y: evento.clientY }
    setDesplazamiento({ x: 0, y: 0 })
    alEmpezar()
  }

  function alMover(evento: React.PointerEvent) {
    if (!pulsandoRef.current) return

    const dx = evento.clientX - origenRef.current.x
    const dy = evento.clientY - origenRef.current.y
    // Solo interesan arriba e izquierda: el resto se ignora para que un
    // temblor de pulgar no dispare nada.
    setDesplazamiento({ x: Math.min(0, dx), y: Math.min(0, dy) })

    if (dx < -UMBRAL_CANCELAR) {
      cancelar()
      return
    }
    if (dy < -UMBRAL_BLOQUEO) {
      pulsandoRef.current = false
      setDesplazamiento({ x: 0, y: 0 })
      setBloqueado(true)
    }
  }

  function alSubir() {
    if (!pulsandoRef.current) return
    enviar()
  }

  /* ── Teclado ───────────────────────────────────────────────────────── */

  useEffect(() => {
    if (deshabilitado) return

    function pulsada(evento: KeyboardEvent) {
      if (evento.code !== 'Space' || evento.repeat) return
      if (esCampoDeTexto(evento.target)) return
      evento.preventDefault()
      if (bloqueado) return
      pulsandoRef.current = true
      alEmpezar()
    }

    function soltada(evento: KeyboardEvent) {
      if (evento.code !== 'Space') return
      if (esCampoDeTexto(evento.target)) return
      if (!pulsandoRef.current) return
      evento.preventDefault()
      enviar()
    }

    window.addEventListener('keydown', pulsada)
    window.addEventListener('keyup', soltada)
    return () => {
      window.removeEventListener('keydown', pulsada)
      window.removeEventListener('keyup', soltada)
    }
  }, [alEmpezar, bloqueado, deshabilitado, enviar])

  /* ── Pintura ───────────────────────────────────────────────────────── */

  if (bloqueado) {
    return (
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={cancelar}
          className="rounded-xl border border-borde px-4 py-3 text-sm text-suave"
        >
          Cancelar
        </button>
        <div className="flex flex-1 items-center gap-2 text-sm text-acento">
          <span className="latido inline-block h-2.5 w-2.5 rounded-full bg-acento" />
          Micrófono abierto
        </div>
        <button
          type="button"
          onClick={enviar}
          className="rounded-xl bg-acento px-6 py-3 text-sm font-semibold text-fondo"
        >
          Enviar
        </button>
      </div>
    )
  }

  const cercaDeCancelar = desplazamiento.x < -UMBRAL_CANCELAR / 2
  const cercaDeBloquear = desplazamiento.y < -UMBRAL_BLOQUEO / 2

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {grabando && (
        <p
          className={`text-[11px] transition-colors ${
            cercaDeCancelar ? 'text-red-300' : cercaDeBloquear ? 'text-acento' : 'text-suave'
          }`}
        >
          {cercaDeCancelar
            ? 'Suelta para cancelar'
            : cercaDeBloquear
              ? 'Suelta para dejarlo abierto'
              : '↑ bloquear · ← cancelar'}
        </p>
      )}

      <button
        type="button"
        disabled={deshabilitado}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSubir}
        onPointerCancel={cancelar}
        aria-label={grabando ? 'Suelta para enviar' : 'Mantén pulsado para hablar'}
        style={{
          transform: `translate(${desplazamiento.x / 3}px, ${desplazamiento.y / 3}px)`,
          // Sin esto el navegador se queda el gesto para hacer scroll y el
          // deslizamiento nunca llega hasta aquí.
          touchAction: 'none',
        }}
        className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl transition-colors select-none disabled:opacity-40 ${
          cercaDeCancelar
            ? 'bg-red-500/25 text-red-200'
            : grabando
              ? 'latido bg-acento text-fondo'
              : fase === 'hablando'
                ? 'bg-tutor/20 text-tutor'
                : 'bg-panel-alto text-texto'
        }`}
      >
        {cercaDeCancelar ? '✕' : grabando ? '🎙️' : fase === 'hablando' ? '🔊' : '🎙️'}
      </button>

      <span className="text-[11px] text-suave">
        {deshabilitado
          ? 'Sin presupuesto'
          : grabando
            ? 'Suelta para enviar'
            : fase === 'pensando'
              ? 'Pensando…'
              : fase === 'hablando'
                ? 'Pulsa para interrumpir'
                : 'Mantén pulsado para hablar'}
      </span>
    </div>
  )
}

/** Con el foco en un input, la barra espaciadora escribe un espacio. */
function esCampoDeTexto(destino: EventTarget | null): boolean {
  const elemento = destino as HTMLElement | null
  if (!elemento?.tagName) return false
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName) || elemento.isContentEditable
}
