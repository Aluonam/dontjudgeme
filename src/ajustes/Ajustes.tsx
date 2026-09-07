import type { Ajustes as TipoAjustes, Presupuesto, Tarjeta } from '../nucleo/tipos.ts'
import { NIVELES } from '../nucleo/tipos.ts'
import { euros } from '../nucleo/presupuesto.ts'
import { MedidorGasto } from '../comun/MedidorGasto.tsx'
import { pronunciar, vocesInglesas } from '../voz/sintesis.ts'

interface Props {
  ajustes: TipoAjustes
  presupuesto: Presupuesto
  tarjetas: Tarjeta[]
  voz: SpeechSynthesisVoice | null
  alCambiar(cambio: Partial<TipoAjustes>): void
  alCambiarPresupuesto(presupuesto: Presupuesto): void
  alGuardarTarjetas(tarjetas: Tarjeta[]): void
}

/** Los topes que se ofrecen. El de verdad sigue siendo el saldo de Anthropic. */
const LIMITES = [3, 5, 10, 20]

export function Ajustes({
  ajustes,
  presupuesto,
  tarjetas,
  voz,
  alCambiar,
  alCambiarPresupuesto,
  alGuardarTarjetas,
}: Props) {
  const voces = vocesInglesas()

  function descargar() {
    const contenido = JSON.stringify({ ajustes, tarjetas, presupuesto }, null, 2)
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }))
    enlace.download = `dontjudgeme-${new Date().toISOString().slice(0, 10)}.json`
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  function vaciar() {
    if (confirm(`Se borran las ${tarjetas.length} entradas del cuaderno. ¿Seguro?`)) {
      alGuardarTarjetas([])
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6">
      <h1 className="mb-4 font-semibold">Ajustes</h1>

      <Bloque
        titulo="Presupuesto del mes"
        ayuda="Este contador es solo el aviso. El tope de verdad es el saldo que tengas cargado en la consola de Anthropic: si cargas cinco euros, cinco euros es lo máximo que puede gastarse, lo diga esta app o no."
      >
        <div className="mb-3 rounded-xl border border-borde bg-panel p-3">
          <MedidorGasto presupuesto={presupuesto} />
          {presupuesto.conversaciones > 0 && (
            <p className="mt-2 text-[11px] text-suave">
              {presupuesto.conversaciones}{' '}
              {presupuesto.conversaciones === 1 ? 'conversación' : 'conversaciones'} · media de{' '}
              {euros(presupuesto.costeMedioEur)} cada una
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {LIMITES.map((limite) => (
            <button
              key={limite}
              type="button"
              onClick={() => alCambiarPresupuesto({ ...presupuesto, limiteEur: limite })}
              className={`rounded-xl border py-2.5 text-sm ${
                presupuesto.limiteEur === limite
                  ? 'border-acento bg-acento/15 text-acento'
                  : 'border-borde text-suave'
              }`}
            >
              {limite} €
            </button>
          ))}
        </div>
      </Bloque>

      <Bloque titulo="Nivel">
        <div className="grid grid-cols-2 gap-2">
          {NIVELES.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => alCambiar({ nivel: n.id })}
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                ajustes.nivel === n.id
                  ? 'border-acento bg-acento/15 text-acento'
                  : 'border-borde text-suave'
              }`}
            >
              {n.etiqueta}
            </button>
          ))}
        </div>
      </Bloque>

      <Bloque
        titulo="Voz"
        ayuda={
          voces.length
            ? 'Las voces las pone el sistema operativo, no la app. En Windows puedes instalar más desde Configuración → Hora e idioma → Voz.'
            : 'Este navegador todavía no ha cargado voces en inglés.'
        }
      >
        <div className="flex gap-2">
          <select
            value={voz?.name ?? ''}
            onChange={(e) => alCambiar({ vozPreferida: e.target.value || null })}
            className="min-w-0 flex-1 rounded-xl border border-borde bg-panel-alto px-3 py-2.5 text-sm"
          >
            {voces.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => pronunciar('Right then, shall we have a proper chat?', voz)}
            className="rounded-xl border border-borde px-4 text-sm"
          >
            Probar
          </button>
        </div>
      </Bloque>

      <Bloque
        titulo="Tus datos"
        ayuda="Todo se guarda solo en este dispositivo. No hay cuenta ni servidor: nada que proteger porque nada sale de aquí."
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={descargar}
            className="flex-1 rounded-xl border border-borde py-2.5 text-sm"
          >
            Exportar
          </button>
          <button
            type="button"
            onClick={vaciar}
            disabled={!tarjetas.length}
            className="flex-1 rounded-xl border border-red-500/40 py-2.5 text-sm text-red-300 disabled:opacity-40"
          >
            Vaciar cuaderno
          </button>
        </div>
      </Bloque>
    </div>
  )
}

function Bloque({
  titulo,
  ayuda,
  children,
}: {
  titulo: string
  ayuda?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-suave uppercase">{titulo}</h2>
      {children}
      {ayuda && <p className="mt-2 text-xs text-suave/70">{ayuda}</p>}
    </section>
  )
}
