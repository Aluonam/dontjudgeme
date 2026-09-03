import Anthropic from '@anthropic-ai/sdk'

/**
 * El turno de conversación. Recibe la charla entera y devuelve, en streaming,
 * lo que hay que decir en voz alta. Nada más: las correcciones no van aquí,
 * van en el informe del final (`api/informe.ts`).
 *
 * Que no corrija sobre la marcha es una decisión de producto, no un descuido.
 * Interrumpir a alguien que está intentando hablar en otro idioma es
 * exactamente lo que hace que deje de intentarlo.
 *
 * Vive en el servidor por una sola razón: la clave. Si esto estuviera en el
 * navegador, cualquiera que abriera las herramientas de desarrollo se
 * llevaría la clave y la factura.
 */

export const config = { runtime: 'edge' }

const MODELO = 'claude-opus-5'

/**
 * En una conversación hablada la latencia es el producto: si tarda tres
 * segundos en contestar, deja de parecer una conversación. Charla informal
 * no necesita razonamiento profundo, así que `low` gana por todos lados —
 * responde antes y cuesta menos. El informe final sí va con esfuerzo alto.
 */
const ESFUERZO = 'low' as const

const NIVELES: Record<string, string> = {
  A2: 'A2 (basic). Short sentences, present and past simple, everyday words. No more than 25 words per turn.',
  B1: 'B1 (intermediate). Common tenses and everyday idioms. Around 30 words per turn.',
  B2: 'B2 (upper-intermediate). Natural pace, phrasal verbs, some colloquialisms. Around 40 words per turn.',
  C1: 'C1 (advanced). Speak exactly as you would to another native: nuance, irony, less common idioms. Around 50 words per turn.',
}

interface Tema {
  titulo: string
  descripcion: string
  funciones: string[]
  terminos: string[]
}

function instrucciones(nivel: string, tema: Tema, erroresPrevios: string[]) {
  const lineas = [
    'You are Alex, an English teacher with fifteen years of experience coaching professionals in tech and business. You are warm, patient and genuinely curious about the person in front of you. She is an adult professional, not a schoolchild: never condescending, never sing-song.',
    '',
    'This is a REAL SPOKEN conversation. Everything you write is read aloud by a speech synthesiser, so write the way people talk, not the way people write.',
    '',
    '# Who she is',
    'A Spanish web developer who also does project management (PMO). She needs English that holds up at work: stand-ups, sprint planning, stakeholder updates, kick-offs, retrospectives, escalations, interviews, and the small talk around all of it. Her level is:',
    NIVELES[nivel] ?? NIVELES.B2,
    '',
    '# Today',
    tema.titulo + ': ' + tema.descripcion,
  ]

  if (tema.funciones.length) {
    lineas.push(
      '',
      'What she is actually practising: ' + tema.funciones.join(', ') + '.',
      'Steer the conversation so she has to do those things. That matters more than the topic itself.',
    )
  }

  if (tema.terminos.length) {
    lineas.push(
      '',
      '# Her target list',
      'She studied these just before this call:',
      tema.terminos.map((t) => '- ' + t).join('\n'),
      '',
      'Open doors for them. Ask the question that makes a word the natural answer. Use some yourself so she hears them in context. NEVER tell her the list exists, never say "try to use...", never congratulate her for using one. If she never reaches for them, that is fine — the report will say so.',
    )
  }

  if (erroresPrevios.length) {
    lineas.push(
      '',
      '# What she keeps getting wrong',
      erroresPrevios.map((e) => '- ' + e).join('\n'),
      '',
      'Set up situations where these come up again, so she gets another go at them. Do not mention this list or correct her on them mid-conversation.',
    )
  }

  lineas.push(
    '',
    '# How you talk',
    '- Two or three sentences. This is a conversation, not a lecture.',
    '- Always hand the ball back: end with a question or something she has to react to.',
    '- React to what she actually said before moving on. Be curious about the content, not just the English.',
    '- Natural professional register: contractions, real workplace phrasing.',
    '',
    '# Mistakes',
    '- Do NOT correct her. Not once. It breaks the flow and makes adults self-conscious, which is the single thing that stops them speaking.',
    '- If a mistake makes her meaning unclear, rephrase it back correctly inside your own reply: "So the deployment slipped — what caused it?". She hears the right form without being stopped.',
    '- If she pauses or gets stuck, wait. Then hand her the one word she is missing and carry straight on.',
    '- If she uses a Spanish word, supply the English one inside your reply and move on. No comment.',
    '',
    '# Never',
    '- Never switch to Spanish. Not even if she does. Rephrase more simply instead.',
    '- Never mention grammar rules, CEFR levels, or that you are an AI.',
    '- Never praise emptily ("Great job!", "Well done!"). Adults hear it as filler.',
    '- No emoji, no markdown, no asterisks, no stage directions: it all gets read aloud.',
    '- Write numbers as words ("twenty-five", not "25"): the synthesiser reads digits badly.',
    '',
    'Reply with the spoken words only. Nothing else.',
  )

  return lineas.join('\n')
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
    tema?: Partial<Tema>
    erroresPrevios?: string[]
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
    String(cuerpo.nivel ?? 'B2'),
    {
      titulo: String(cuerpo.tema?.titulo ?? 'Small talk').slice(0, 120),
      descripcion: String(cuerpo.tema?.descripcion ?? 'A relaxed chat about anything.').slice(0, 800),
      funciones: (cuerpo.tema?.funciones ?? []).slice(0, 6).map(String),
      terminos: (cuerpo.tema?.terminos ?? []).slice(0, 40).map((t) => String(t).slice(0, 80)),
    },
    (cuerpo.erroresPrevios ?? []).slice(0, 8).map((e) => String(e).slice(0, 160)),
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
          max_tokens: 400,
          output_config: { effort: ESFUERZO },
          // El sistema es idéntico en todos los turnos de una conversación y
          // ocupa bastante (lleva el vocabulario del tema). Cachearlo baja el
          // coste de entrada a una décima parte y adelanta el primer token.
          system: [{ type: 'text', text: sistema, cache_control: { type: 'ephemeral' } }],
          messages: mensajes,
          // Si un clasificador rechaza el turno, la API reencamina sola a
          // otro modelo en lugar de dejar la conversación muda.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        })

        for await (const evento of respuesta) {
          if (evento.type !== 'content_block_delta') continue
          if (evento.delta.type !== 'text_delta') continue
          enviar({ t: 'texto', v: evento.delta.text })
        }

        const final = await respuesta.finalMessage()

        if (final.stop_reason === 'refusal') {
          enviar({ t: 'error', v: 'El modelo ha preferido no responder a eso. Prueba con otro tema.' })
        }

        // El medidor de gasto de la app se alimenta de aquí. Son los tokens
        // reales facturados, no una estimación.
        enviar({
          t: 'uso',
          v: {
            input_tokens: final.usage.input_tokens,
            output_tokens: final.usage.output_tokens,
            cache_read_input_tokens: final.usage.cache_read_input_tokens ?? 0,
            cache_creation_input_tokens: final.usage.cache_creation_input_tokens ?? 0,
          },
        })
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

export function mensajeDeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return 'La clave de Anthropic no es válida.'
  if (error instanceof Anthropic.RateLimitError) return 'Demasiadas peticiones seguidas; espera unos segundos.'
  if (error instanceof Anthropic.APIConnectionError) return 'Sin conexión con Anthropic.'
  if (error instanceof Anthropic.APIError) {
    // 400 con saldo agotado es el caso que más va a pasar: merece su mensaje.
    if (error.status === 400 && /credit|balance/i.test(error.message)) {
      return 'Se ha agotado el saldo de la cuenta de Anthropic. Recárgalo en la consola.'
    }
    return 'Error de la API (' + error.status + ').'
  }
  return 'Algo ha fallado al pedir la respuesta.'
}

export function json(dato: unknown, estado: number) {
  return new Response(JSON.stringify(dato), {
    status: estado,
    headers: { 'content-type': 'application/json' },
  })
}
