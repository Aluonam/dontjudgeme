import type { Ajustes as TipoAjustes, Tarjeta } from '../nucleo/tipos.ts'
import { NIVELES } from '../nucleo/tipos.ts'
import { SITUACIONES } from '../nucleo/escenarios.ts'
import { pronunciar, vocesInglesas } from '../voz/sintesis.ts'

interface Props {
  ajustes: TipoAjustes
  tarjetas: Tarjeta[]
  voz: SpeechSynthesisVoice | null
  alCambiar(cambio: Partial<TipoAjustes>): void
  alGuardarTarjetas(tarjetas: Tarjeta[]): void
}

export function Ajustes({ ajustes, tarjetas, voz, alCambiar, alGuardarTarjetas }: Props) {
  const voces = vocesInglesas()

  function descargar() {
    const contenido = JSON.stringify({ ajustes, tarjetas }, null, 2)
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }))
    enlace.download = `speakup-${new Date().toISOString().slice(0, 10)}.json`
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

      <Bloque titulo="Situación por defecto">
        <select
          value={ajustes.situacion}
          onChange={(e) => alCambiar({ situacion: e.target.value })}
          className="w-full rounded-xl border border-borde bg-panel-alto px-3 py-2.5 text-sm"
        >
          {SITUACIONES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.titulo}
            </option>
          ))}
        </select>
      </Bloque>

      <Bloque
        titulo="Manos libres"
        ayuda="El micrófono se abre solo en cuanto el tutor termina de hablar. Apágalo si estás en un sitio con ruido."
      >
        <button
          type="button"
          onClick={() => alCambiar({ manosLibres: !ajustes.manosLibres })}
          className={`w-full rounded-xl border px-3 py-2.5 text-sm ${
            ajustes.manosLibres ? 'border-tutor bg-tutor/15 text-tutor' : 'border-borde text-suave'
          }`}
        >
          {ajustes.manosLibres ? 'Encendido' : 'Apagado'}
        </button>
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

      <Bloque titulo="Tus datos" ayuda="Todo se guarda solo en este dispositivo. No hay cuenta ni servidor.">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={descargar}
            className="flex-1 rounded-xl border border-borde py-2.5 text-sm"
          >
            Exportar cuaderno
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
