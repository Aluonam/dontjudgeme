import Anthropic from '@anthropic-ai/sdk'

/**
 * El interlocutor. Recibe la conversación entera y devuelve, en streaming,
 * lo que hay que decir en voz alta; al final, un extra con la corrección y
 * el vocabulario de la jugada.
 *
 * Vive en el servidor por una sola razón: la clave. Si esto estuviera en el
 * navegador, cualquiera que abriera las herramientas de desarrollo se
 * llevaría la clave y la factura.
 */

export const config = { runtime: 'edge' }

const MODELO = 'claude-opus-5'

/**
 * En una conversación hablada la latencia es el producto: si tarda tres
 * segundos en contestar, deja de parecer una conversación. `low` es el
 * ajuste para charla; súbelo si notas las respuestas planas.
 */
const ESFUERZO = 'low' as const

/** Separador entre lo que se dice en voz alta y la ficha del profesor. */
const MARCA = '---COACH---'

const NIVELES: Record<string, string> = {
  A2: 'A2 (basic). Use short sentences, present and past simple, everyday words. No more than 25 words per turn.',
  B1: 'B1 (intermediate). Use common tenses and everyday idioms. Around 30 words per turn.',
  B2: 'B2 (upper-intermediate). Natural pace, phrasal verbs, some colloquialisms. Around 40 words per turn.',
  C1: 'C1 (advanced). Speak exactly as you would to another native: nuance, irony, less common idioms. Around 50 words per turn.',
}

function instrucciones(nivel: string, titulo: string, descripcion: string) {
  return [
    'You are Milo, a warm, funny native English speaker from Bristol. You are having a REAL SPOKEN conversation with a Spanish speaker practising her English out loud. Everything you write is read aloud by a speech synthesiser, so write the way people talk, not the way people write.',
    '',
    '# The situation',
    titulo + ': ' + descripcion,
    '',
    '# Her level',
    NIVELES[nivel] ?? NIVELES.B1,
    '',
    '# How to talk',
    '- English only in the spoken part. Never translate for her there.',
    '- One idea per turn. Always hand the conversation back: end with a question or something she has to react to.',
    '- React to what she actually said before moving on. If she says something interesting, be curious about it.',
    '- Slip ONE useful idiom, phrasal verb or saying into your reply when it fits naturally. Do not force one every turn.',
    '- If she goes quiet or says she is stuck, give her the English she is missing and carry on. Never break character to lecture.',
    '- No emoji, no markdown, no stage directions, no asterisks: it all gets read aloud.',
    '- Write numbers as words ("twenty-five", not "25"), because the synthesiser reads digits badly.',
    '',
    '# After speaking',
    'Write the spoken reply first. Then a line containing exactly ' +
      MARCA +
      ', and after it a JSON object (no code fences) with this shape:',
    '',
    '{',
    '  "correccion": { "original": "what she said", "mejor": "how a native would say it", "porque": "explicación breve EN ESPAÑOL" } | null,',
    '  "vocabulario": [ { "termino": "word or phrase", "significado": "en español", "ejemplo": "a natural sentence using it" } ],',
    '  "expresion": { "frase": "the idiom you used", "tipo": "idiom" | "phrasal" | "refran", "significado": "en español", "ejemplo": "another natural use" } | null',
    '}',
    '',
    'Rules for that JSON:',
    '- "correccion" only when she made a mistake a native would actually notice, or said something technically correct but unnatural. Otherwise null. Do not nitpick: one wrong article is not worth stopping for.',
    '- "vocabulario": zero to two entries, only words SHE is missing or that YOU just used and she probably does not know. An empty array is a fine answer.',
    '- "expresion": only if you actually used an idiom, phrasal verb or saying in this turn. Otherwise null.',
    '- Spanish in "porque" and "significado", English everywhere else.',
    '- Nothing after the closing brace.',
  ].join('\n')
}

type MensajeCliente = { papel: 'yo' | 'tutor'; texto: string }

export default async function manejador(peticion: Request): Promise<Response> {
  if (peticion.method !== 'POST') return json({ error: 'Usa POST' }, 405)

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(
      { error: 'Falta ANTHROPIC_API_KEY. Copia .env.example a .env.local y pega tu clave.' },
      500,
    )
  }

  let cuerpo: {
    nivel?: string
    situacion?: { titulo?: string; descripcion?: string }
    mensajes?: MensajeCliente[]
  }
  try {
    cuerpo = (await peticion.json()) as typeof cuerpo
  } catch {
    return json({ error: 'El cuerpo no es JSON' }, 400)
  }

  const mensajes = (cuerpo.mensajes ?? [])
    .filter((m) => typeof m?.texto === 'string' && m.texto.trim())
    // Una charla hablada no necesita memoria infinita, y cada turno reenvía
    // el historial entero: recortar aquí es lo que evita que una
    // conversación larga se vuelva lenta y cara.
    .slice(-24)
    .map((m) => ({
      role: m.papel === 'yo' ? ('user' as const) : ('assistant' as const),
      content: m.texto.slice(0, 2000),
    }))

  if (!mensajes.length) return json({ error: 'No hay nada que responder' }, 400)

  const sistema = instrucciones(
    String(cuerpo.nivel ?? 'B1'),
    String(cuerpo.situacion?.titulo ?? 'Small talk').slice(0, 120),
    String(cuerpo.situacion?.descripcion ?? 'A relaxed chat about anything.').slice(0, 600),
  )

  const cliente = new Anthropic()
  const codificador = new TextEncoder()

  const flujo = new ReadableStream<Uint8Array>({
    async start(control) {
      const enviar = (dato: unknown) =>
        control.enqueue(codificador.encode('data: ' + JSON.stringify(dato) + '\n\n'))

      try {
        const respuesta = cliente.beta.messages.stream({
          model: MODELO,
          max_tokens: 1500,
          output_config: { effort: ESFUERZO },
          system: sistema,
          messages: mensajes,
          // Si un clasificador rechaza el turno, la API reencamina sola a
          // otro modelo en lugar de dejar la conversación muda.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        })

        let todo = ''
        let emitido = 0
        let inicioCoach = -1

        for await (const evento of respuesta) {
          if (evento.type !== 'content_block_delta') continue
          if (evento.delta.type !== 'text_delta') continue

          todo += evento.delta.text
          if (inicioCoach >= 0) continue

          const encontrada = todo.indexOf(MARCA, Math.max(0, emitido - MARCA.length))
          if (encontrada >= 0) {
            inicioCoach = encontrada
            const resto = todo.slice(emitido, encontrada)
            if (resto) enviar({ t: 'texto', v: resto })
            emitido = encontrada
            continue
          }

          // La marca puede llegar partida entre dos deltas, así que
          // retenemos siempre una cola del tamaño del separador. Sin esto,
          // el sintetizador acabaría leyendo en voz alta "---COACH---".
          const seguro = todo.length - (MARCA.length - 1)
          if (seguro > emitido) {
            enviar({ t: 'texto', v: todo.slice(emitido, seguro) })
            emitido = seguro
          }
        }

        if (inicioCoach < 0 && todo.length > emitido) {
          enviar({ t: 'texto', v: todo.slice(emitido) })
        }

        const ficha = inicioCoach >= 0 ? extraerJson(todo.slice(inicioCoach + MARCA.length)) : null
        if (ficha) enviar({ t: 'coach', v: ficha })

        const final = await respuesta.finalMessage()
        if (final.stop_reason === 'refusal') {
          enviar({ t: 'error', v: 'El modelo ha preferido no responder a eso. Prueba con otro tema.' })
        }
      } catch (error) {
        enviar({ t: 'error', v: mensajeDeError(error) })
      } finally {
        control.close()
      }
    },
  })

  return new Response(flujo, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  })
}

/** El modelo obedece casi siempre, pero un turno mal formado no debe tirar la charla. */
function extraerJson(texto: string): unknown {
  const limpio = texto.replace(/```(?:json)?/g, '').trim()
  const abre = limpio.indexOf('{')
  const cierra = limpio.lastIndexOf('}')
  if (abre < 0 || cierra <= abre) return null
  try {
    return JSON.parse(limpio.slice(abre, cierra + 1))
  } catch {
    return null
  }
}

function mensajeDeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return 'La clave de Anthropic no es válida.'
  if (error instanceof Anthropic.RateLimitError) return 'Demasiadas peticiones seguidas; espera unos segundos.'
  if (error instanceof Anthropic.APIConnectionError) return 'Sin conexión con Anthropic.'
  if (error instanceof Anthropic.APIError) return 'Error de la API (' + error.status + ').'
  return 'Algo ha fallado al pedir la respuesta.'
}

function json(dato: unknown, estado: number) {
  return new Response(JSON.stringify(dato), {
    status: estado,
    headers: { 'content-type': 'application/json' },
  })
}
