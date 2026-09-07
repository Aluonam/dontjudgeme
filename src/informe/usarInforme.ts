import { useCallback, useState } from 'react'
import type { Informe, Mensaje, Tema } from '../nucleo/tipos.ts'
import type { Uso } from '../nucleo/presupuesto.ts'
import { terminosDe } from '../nucleo/temas.ts'

/** Con menos de esto no hay nada que analizar y la llamada sería dinero tirado. */
const MINIMO_TURNOS = 2

/**
 * Pedir el informe del final.
 *
 * Vive aparte del hook de conversación a propósito: son dos llamadas con
 * prioridades opuestas —una corre, la otra acierta— y mezclarlas hacía que un
 * solo archivo llevase el micrófono, el streaming y el análisis.
 *
 * El gasto no se contabiliza aquí: se devuelve hacia arriba por `alUso`, para
 * que siga habiendo un único sitio que suma euros.
 */
export function usarInforme({ alUso }: { alUso(uso: Uso): void }) {
  const [informe, setInforme] = useState<Informe | null>(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generar = useCallback(
    async (tema: Tema, mensajes: Mensaje[], duracionMs: number): Promise<Informe | null> => {
      const turnos = mensajes.filter((m) => m.papel === 'yo').length
      if (turnos < MINIMO_TURNOS) {
        setError('Habla un poco más y te hago el informe.')
        return null
      }

      setGenerando(true)
      setError(null)

      try {
        const respuesta = await fetch('/api/informe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            tema: { titulo: tema.titulo, descripcion: tema.descripcion },
            terminos: terminosDe(tema),
            mensajes: mensajes.map((m) => ({ papel: m.papel, texto: m.texto })),
          }),
        })

        const datos = await respuesta.json()
        if (!respuesta.ok) throw new Error(datos?.error ?? 'No se ha podido generar el informe.')

        if (datos.uso) alUso(datos.uso as Uso)

        const generado = normalizar(datos.informe, tema, turnos, duracionMs)
        setInforme(generado)
        return generado
      } catch (fallo) {
        // Que falle el informe no borra la conversación: sigue en pantalla y
        // se puede volver a colgar.
        setError((fallo as Error).message)
        return null
      } finally {
        setGenerando(false)
      }
    },
    [alUso],
  )

  const limpiar = useCallback(() => {
    setInforme(null)
    setError(null)
  }, [])

  return { informe, generando, error, generar, limpiar }
}

/** El esquema obliga a la forma, pero el JSON llega de fuera: se comprueba igual. */
function normalizar(crudo: unknown, tema: Tema, turnos: number, duracionMs: number): Informe {
  const dato = (crudo ?? {}) as Partial<Informe>
  const lista = <T,>(valor: unknown): T[] => (Array.isArray(valor) ? (valor as T[]) : [])

  return {
    id: crypto.randomUUID(),
    temaId: tema.id,
    temaTitulo: tema.titulo,
    fecha: Date.now(),
    turnos,
    duracionMs,
    fallos: lista(dato.fallos),
    mejoras: lista(dato.mejoras),
    aciertos: lista(dato.aciertos),
    usadas: lista(dato.usadas),
    noUsadas: lista(dato.noUsadas),
  }
}
