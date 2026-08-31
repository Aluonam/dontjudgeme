import { useCallback, useEffect, useMemo, useState } from 'react'
import { guardarAjustes, guardarTarjetas, leer } from './nucleo/almacen.ts'
import type { Ajustes, Ficha, Tarjeta } from './nucleo/tipos.ts'
import { buscarSituacion } from './nucleo/escenarios.ts'
import { fusionar, pendientes, tarjetasDeFicha } from './cuaderno/repaso.ts'
import { alCargarVoces, elegirVoz } from './voz/sintesis.ts'
import { Conversacion } from './conversacion/Conversacion.tsx'
import { Cuaderno } from './cuaderno/Cuaderno.tsx'
import { Ajustes as PantallaAjustes } from './ajustes/Ajustes.tsx'

type Pestana = 'hablar' | 'cuaderno' | 'ajustes'

export function App() {
  const inicial = useMemo(leer, [])
  const [ajustes, setAjustes] = useState<Ajustes>(inicial.ajustes)
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>(inicial.tarjetas)
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

  const aprender = useCallback((ficha: Ficha) => {
    setTarjetas((previas) => {
      const siguiente = fusionar(previas, tarjetasDeFicha(ficha))
      if (siguiente !== previas) guardarTarjetas(siguiente)
      return siguiente
    })
  }, [])

  const situacion = buscarSituacion(ajustes.situacion)
  const porRepasar = pendientes(tarjetas).length

  return (
    <div className="flex h-full flex-col bg-fondo">
      <main className="min-h-0 flex-1">
        {pestana === 'hablar' && (
          <Conversacion
            ajustes={ajustes}
            situacion={situacion}
            voz={voz}
            alAprender={aprender}
            alCambiar={cambiarAjustes}
          />
        )}
        {pestana === 'cuaderno' && (
          <Cuaderno tarjetas={tarjetas} voz={voz} alGuardar={cambiarTarjetas} />
        )}
        {pestana === 'ajustes' && (
          <PantallaAjustes
            ajustes={ajustes}
            tarjetas={tarjetas}
            voz={voz}
            alCambiar={cambiarAjustes}
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
      className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
        activa ? 'text-acento' : 'text-suave'
      }`}
    >
      <span className="text-lg leading-none">{icono}</span>
      {children}
      {!!insignia && (
        <span className="absolute top-2 right-[28%] rounded-full bg-acento px-1.5 text-[10px] font-bold text-fondo">
          {insignia}
        </span>
      )}
    </button>
  )
}
