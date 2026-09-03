import Anthropic from '@anthropic-ai/sdk'
import { json, mensajeDeError } from './chat.ts'

/**
 * El informe del final.
 *
 * Una sola llamada al colgar, con la transcripción entera. Aquí es donde se
 * corrige: durante la conversación no se para a nadie, y todo lo que había
 * que decir se dice de golpe cuando ya no interrumpe nada.
 *
 * A diferencia del chat, esto va con esfuerzo alto y sin prisa. Es la parte
 * que de verdad enseña, cuesta unos céntimos y nadie está esperando con el
 * micrófono abierto.
 */

export const config = { runtime: 'edge' }

const MODELO = 'claude-opus-5'

/** Aquí sí importa acertar más que correr: es lo único que se lee después. */
const ESFUERZO = 'high' as const

const ESQUEMA = {
  type: 'object',
  properties: {
    fallos: {
      type: 'array',
      description: 'Mistakes worth telling her about. Ten at most, the ten that matter.',
      items: {
        type: 'object',
        properties: {
          dijiste: { type: 'string', description: 'Her exact words, quoted.' },
          mejor: { type: 'string', description: 'How a native would say it.' },
          porque: { type: 'string', description: 'One line, in Spanish.' },
          tipo: {
            type: 'string',
            enum: ['gramatica', 'vocabulario', 'calco', 'registro'],
          },
        },
        required: ['dijiste', 'mejor', 'porque', 'tipo'],
        additionalProperties: false,
      },
    },
    mejoras: {
      type: 'array',
      description:
        'Things that were correct but would sound better. Register, naturalness, repetition. Five at most.',
      items: {
        type: 'object',
        properties: {
          dijiste: { type: 'string' },
          masNatural: { type: 'string' },
          porque: { type: 'string', description: 'One line, in Spanish.' },
        },
        required: ['dijiste', 'masNatural', 'porque'],
        additionalProperties: false,
      },
    },
    aciertos: {
      type: 'array',
      description: 'Three specific things she genuinely did well. In Spanish. Never generic praise.',
      items: { type: 'string' },
    },
    usadas: {
      type: 'array',
      description: 'Terms from the target list she actually used, copied verbatim from the list.',
      items: { type: 'string' },
    },
    noUsadas: {
      type: 'array',
      description: 'Terms from the target list she never used, copied verbatim from the list.',
      items: { type: 'string' },
    },
  },
  required: ['fallos', 'mejoras', 'aciertos', 'usadas', 'noUsadas'],
  additionalProperties: false,
} as const

const SISTEMA = [
  'You are an English examiner reviewing a transcript of a spoken conversation. The learner is a Spanish web developer who also does project management. Be precise and useful, not encouraging for its own sake.',
  '',
  'Judge only what SHE said. The other speaker is a native and is not being assessed.',
  '',
  '# Fallos',
  'Real mistakes a native would notice. Quote her exact words. Skip anything that is just spoken-language mess — false starts, repetitions, self-corrections — and skip obvious speech-recognition noise: this was dictated, so a stray word that makes no sense is probably the microphone, not her.',
  'Sort by how much the mistake would cost her at work, worst first.',
  '',
  '# Mejoras',
  'Things that were grammatically fine but would sound off in a professional setting: too blunt, too formal, too tentative, or the same word four times. At her level this matters more than textbook grammar. Include a missed chance where a term from her target list was exactly the right thing to say.',
  '',
  '# Aciertos',
  'Three specific things. "Buen uso del pasado continuo" is useful; "¡muy bien!" is not.',
  '',
  '# Vocabulario',
  'Split the target list in two: what she used and what she did not. Count a term as used if she said it in any reasonable form — plural, past tense, a small variation. Copy the terms exactly as they appear in the list, so the app can match them.',
  '',
  'Everything the learner reads — porque, aciertos — in Spanish. English only for the quoted English.',
].join('\n')

interface CuerpoInforme {
  tema?: { titulo?: string; descripcion?: string }
  terminos?: string[]
  mensajes?: { papel: 'yo' | 'tutor'; texto: string }[]
}

export default async function manejador(peticion: Request): Promise<Response> {
  if (peticion.method !== 'POST') return json({ error: 'Usa POST' }, 405)

  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'Falta ANTHROPIC_API_KEY.' }, 500)
  }

  let cuerpo: CuerpoInforme
  try {
    cuerpo = (await peticion.json()) as CuerpoInforme
  } catch {
    return json({ error: 'El cuerpo no es JSON' }, 400)
  }

  const mensajes = (cuerpo.mensajes ?? []).filter(
    (m) => typeof m?.texto === 'string' && m.texto.trim(),
  )

  // Con dos frases no hay nada que analizar y la llamada sería dinero tirado.
  const suyos = mensajes.filter((m) => m.papel === 'yo')
  if (suyos.length < 2) {
    return json({ error: 'La conversación es demasiado corta para sacar nada en claro.' }, 400)
  }

  const terminos = (cuerpo.terminos ?? []).slice(0, 40).map((t) => String(t).slice(0, 80))

  const transcripcion = mensajes
    .map((m) => (m.papel === 'yo' ? 'LEARNER: ' : 'NATIVE: ') + m.texto.slice(0, 2000))
    .join('\n')

  const entrada = [
    'Topic: ' + String(cuerpo.tema?.titulo ?? '—'),
    '',
    'Target list she studied beforehand:',
    terminos.length ? terminos.map((t) => '- ' + t).join('\n') : '(none)',
    '',
    'Transcript:',
    transcripcion,
  ].join('\n')

  try {
    const cliente = new Anthropic()

    const respuesta = await cliente.messages.create({
      model: MODELO,
      max_tokens: 8000,
      output_config: {
        effort: ESFUERZO,
        format: { type: 'json_schema', schema: ESQUEMA },
      },
      system: SISTEMA,
      messages: [{ role: 'user', content: entrada }],
    })

    const texto = respuesta.content
      .filter((bloque): bloque is Anthropic.TextBlock => bloque.type === 'text')
      .map((bloque) => bloque.text)
      .join('')

    return json(
      {
        informe: JSON.parse(texto),
        uso: {
          input_tokens: respuesta.usage.input_tokens,
          output_tokens: respuesta.usage.output_tokens,
          cache_read_input_tokens: respuesta.usage.cache_read_input_tokens ?? 0,
          cache_creation_input_tokens: respuesta.usage.cache_creation_input_tokens ?? 0,
        },
      },
      200,
    )
  } catch (error) {
    // Que falle el informe no debe borrar la conversación: el cliente se
    // queda con la transcripción y puede volver a pedirlo.
    return json({ error: mensajeDeError(error) }, 502)
  }
}
