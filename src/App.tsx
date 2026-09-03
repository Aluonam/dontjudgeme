import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  guardarAjustes,
  guardarInformes,
  guardarPresupuesto,
  guardarTarjetas,
  leer,
} from './nucleo/almacen.ts'
import type { Ajustes, Gasto, Informe, Presupuesto, Tarjeta, Tema } from './nucleo/tipos.ts'
import { anotar, cerrarConversacion } from './nucleo/presupuesto.ts'
import { fusionar, pendientes, tarjetasDeTema } from './cuaderno/repaso.ts'
import { alCargarVoces, elegirVoz } from './voz/sintesis.ts'
import { Sesion } from './sesion/Sesion.tsx'
import { Cuaderno } from './cuaderno/Cuaderno.tsx'
import { Historial } from './informe/Historial.tsx'
import { Ajustes as PantallaAjustes } from './ajustes/Ajustes.tsx'

type Pestana = 'hablar' | 'cuaderno' | 'historial' | 'ajustes'

export function App() {
  const inicial = useMemo(leer, [])
  const [ajustes, setAjustes] = useState<Ajustes>(inicial.ajustes)
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>(inicial.tarjetas)
  const [informes, setInformes] = useState<Informe[]>(inicial.informes)
  const [presupuesto, setPresupuesto] = useState<Presupuesto>(inicial.presupuesto)
  const [pestana, setPestana] = useState<Pestana>('hablar')
  const [voces, setVoces] = useState<number>(0)

  // Chrome entrega la lista de voces tarde y de golpe. Este contador solo
  // existe para volver a preguntar cuando eso pasa.
  useEffect(() => alCargarVoces(() => setVoces((n) => n + 1)), [])

  const voz = useMemo(() => elegirVoz(ajustes.vozPreferida), [ajustes.vozPreferida, voces])

  const cambiarAjustes = useCallback((cambio: Partial<Ajustes>) => {
    setAjustes((previos) => {
      const siguiente = { ...previos, ...cambio }
      guardarAjustes(siguiente)
      return siguiente
    })
  }, [])

  const cambiarTarjetas = useCallback((siguiente: Tarjeta[]) => {
    setTarjetas(siguiente)
    guardarTarjetas(siguiente)
  }, [])

  const cambiarPresupuesto = useCallback((siguiente: Presupuesto) => {
    setPresupuesto(siguiente)
    guardarPresupuesto(siguiente)
  }, [])

  /** Cada llamada a la API pasa por aquí. Es el único sitio que suma gasto. */
  const gastar = useCallback((gasto: Gasto) => {
    setPresupuesto((previo) => {
      const siguiente = anotar(previo, gasto)
      guardarPresupuesto(siguiente)
      return siguiente
    })
  }, [])

  const guardarInforme = useCallback((informe: Informe, tema: Tema, costeEur: number) => {
    setInformes((previos) => {
      const siguiente = [...previos, informe]
      guardarInformes(siguiente)
      return siguiente
    })

    // El vocabulario del tema entra en el cuaderno ahora, ya usado.
    setTarjetas((previas) => {
      const siguiente = fusionar(previas, tarjetasDeTema(tema))
      if (siguiente !== previas) guardarTarjetas(siguiente)
      return siguiente
    })

    // Y el coste real de esta conversación afina la estimación de la próxima.
    setPresupuesto((previo) => {
      const siguiente = cerrarConversacion(previo, costeEur)
      guardarPresupuesto(siguiente)
      return siguiente
    })
  }, [])

  const porRepasar = pendientes(tarjetas).length

  return (
    <div className="flex h-full flex-col bg-fondo">
      <main className="min-h-0 flex-1 overflow-y-auto">
        {pestana === 'hablar' && (
          <Sesion
            ajustes={ajustes}
            presupuesto={presupuesto}
            informes={informes}
            voz={voz}
            alCambiarAjustes={cambiarAjustes}
            alGastar={gastar}
            alGuardarInforme={guardarInforme}
          />
        )}
        {pestana === 'cuaderno' && (
          <Cuaderno tarjetas={tarjetas} voz={voz} alGuardar={cambiarTarjetas} />
        )}
        {pestana === 'historial' && <Historial informes={informes} voz={voz} />}
        {pestana === 'ajustes' && (
          <PantallaAjustes
            ajustes={ajustes}
            presupuesto={presupuesto}
            tarjetas={tarjetas}
            voz={voz}
            alCambiar={cambiarAjustes}
            alCambiarPresupuesto={cambiarPresupuesto}
            alGuardarTarjetas={cambiarTarjetas}
          />
        )}
      </main>

      <nav className="flex shrink-0 border-t border-borde bg-panel pb-[env(safe-area-inset-bottom)]">
        <Pestanya activa={pestana === 'hablar'} onClick={() => setPestana('hablar')} icono="🎙️">
          Hablar
        </Pestanya>
        <Pestanya
          activa={pestana === 'cuaderno'}
          onClick={() => setPestana('cuaderno')}
          icono="📓"
          insignia={porRepasar}
        >
          Cuaderno
        </Pestanya>
        <Pestanya
          activa={pestana === 'historial'}
          onClick={() => setPestana('historial')}
          icono="📈"
        >
          Informes
        </Pestanya>
        <Pestanya activa={pestana === 'ajustes'} onClick={() => setPestana('ajustes')} icono="⚙️">
          Ajustes
        </Pestanya>
      </nav>
    </div>
  )
}

function Pestanya({
  activa,
  onClick,
  icono,
  insignia,
  children,
}: {
  activa: boolean
  onClick: () => void
  icono: string
  insignia?: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[11px] transition-colors ${
        activa ? 'text-acento' : 'text-suave'
      }`}
    >
      <span className="text-lg leading-none">{icono}</span>
      {children}
      {!!insignia && (
        <span className="absolute top-2 right-[22%] rounded-full bg-acento px-1.5 text-[10px] font-bold text-fondo">
          {insignia}
        </span>
      )}
    </button>
  )
}
