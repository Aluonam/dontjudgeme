import type { Presupuesto } from './tipos.ts'
import { conversacionesRestantes, euros, fraccion, nivelAviso } from './presupuesto.ts'

/**
 * La barra de gasto.
 *
 * Está siempre visible a propósito. El aviso que sirve no es el correo de
 * Anthropic cuando ya te has pasado, es el que ves mientras decides si
 * empiezas otra conversación.
 *
 * Y se dice en conversaciones, no solo en euros: "te quedan 1,20 €" no
 * significa nada; "te quedan unas cinco conversaciones" sí.
 */

const COLOR = {
  tranquilo: 'bg-suave/50',
  mitad: 'bg-amber-400',
  alto: 'bg-orange-400',
  critico: 'bg-red-400',
  agotado: 'bg-red-500',
}

const TEXTO = {
  tranquilo: 'text-suave',
  mitad: 'text-amber-300',
  alto: 'text-orange-300',
  critico: 'text-red-300',
  agotado: 'text-red-300',
}

export function MedidorGasto({
  presupuesto,
  compacto = false,
}: {
  presupuesto: Presupuesto
  compacto?: boolean
}) {
  const nivel = nivelAviso(presupuesto)
  const parte = fraccion(presupuesto)
  const quedan = conversacionesRestantes(presupuesto)

  const nota =
    nivel === 'agotado'
      ? 'Presupuesto agotado este mes'
      : nivel === 'critico'
        ? 'Última conversación disponible'
        : nivel === 'alto'
          ? `Te quedan unas ${quedan} conversaciones`
          : nivel === 'mitad'
            ? 'Mitad del presupuesto'
            : `Unas ${quedan} conversaciones`

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className={TEXTO[nivel]}>{nota}</span>
        <span className="tabular-nums text-suave">
          {euros(presupuesto.gastadoEur)} / {euros(presupuesto.limiteEur)}
        </span>
      </div>

      <div
        className={`mt-1 w-full overflow-hidden rounded-full bg-panel-alto ${compacto ? 'h-1' : 'h-1.5'}`}
        role="progressbar"
        aria-valuenow={Math.round(parte * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Presupuesto consumido"
      >
        <div
          className={`h-full rounded-full transition-all ${COLOR[nivel]}`}
          style={{ width: `${Math.max(parte * 100, parte > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  )
}
