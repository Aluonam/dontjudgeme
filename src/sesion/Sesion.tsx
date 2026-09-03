import { useMemo, useState } from 'react'
import type { Ajustes, Gasto, Informe, Tema } from '../nucleo/tipos.ts'
import type { Presupuesto } from '../nucleo/tipos.ts'
import { buscarTema } from '../nucleo/temas.ts'
import { SelectorTemas } from '../temas/SelectorTemas.tsx'
import { Preparacion } from '../temas/Preparacion.tsx'
import { Conversacion } from '../conversacion/Conversacion.tsx'
import { InformeFinal } from '../informe/InformeFinal.tsx'
import { erroresRecurrentes } from '../informe/recurrentes.ts'

/**
 * El recorrido completo de una sesión:
 *
 *   elegir tema  →  repasar vocabulario  →  hablar  →  informe
 *
 * Los dos primeros pasos no llaman a la API y por tanto no cuestan nada. Ese
 * es el motivo de que el repaso vaya antes y no después: llegas a la
 * conversación con las palabras frescas y gastando lo justo.
 */
type Paso = 'temas' | 'preparacion' | 'hablando' | 'informe'

interface Props {
  ajustes: Ajustes
  presupuesto: Presupuesto
  informes: Informe[]
  voz: SpeechSynthesisVoice | null
  alCambiarAjustes(cambio: Partial<Ajustes>): void
  alGastar(gasto: Gasto): void
  alGuardarInforme(informe: Informe, tema: Tema, costeEur: number): void
}

export function Sesion({
  ajustes,
  presupuesto,
  informes,
  voz,
  alCambiarAjustes,
  alGastar,
  alGuardarInforme,
}: Props) {
  const [paso, setPaso] = useState<Paso>('temas')
  const [ultimo, setUltimo] = useState<{ informe: Informe; costeEur: number } | null>(null)

  const tema = buscarTema(ajustes.temaId)
  const erroresPrevios = useMemo(() => erroresRecurrentes(informes), [informes])

  function elegir(elegido: Tema) {
    alCambiarAjustes({ temaId: elegido.id })
    setPaso('preparacion')
  }

  function terminar(informe: Informe, costeEur: number) {
    setUltimo({ informe, costeEur })
    alGuardarInforme(informe, tema, costeEur)
    setPaso('informe')
  }

  if (paso === 'temas') {
    return (
      <SelectorTemas
        nivel={ajustes.nivel}
        alElegir={elegir}
        alCambiarNivel={(nivel) => alCambiarAjustes({ nivel })}
      />
    )
  }

  if (paso === 'preparacion') {
    return (
      <Preparacion
        tema={tema}
        presupuesto={presupuesto}
        voz={voz}
        alEmpezar={() => setPaso('hablando')}
        alVolver={() => setPaso('temas')}
      />
    )
  }

  if (paso === 'hablando') {
    return (
      <Conversacion
        // Cambiar de tema tiene que empezar una conversación limpia, no
        // reutilizar el hook con el historial de la anterior dentro.
        key={tema.id}
        tema={tema}
        nivel={ajustes.nivel}
        voz={voz}
        presupuesto={presupuesto}
        erroresPrevios={erroresPrevios}
        alGastar={alGastar}
        alTerminar={terminar}
        alSalir={() => setPaso('preparacion')}
      />
    )
  }

  if (!ultimo) {
    setPaso('temas')
    return null
  }

  return (
    <InformeFinal
      informe={ultimo.informe}
      costeEur={ultimo.costeEur}
      voz={voz}
      alRepetir={() => setPaso('preparacion')}
      alOtroTema={() => setPaso('temas')}
    />
  )
}
