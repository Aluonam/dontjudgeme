import type { Situacion } from './tipos.ts'

/**
 * Las situaciones. La descripción va en inglés porque se le pasa tal cual al
 * modelo como parte de sus instrucciones; el título y el emoji son para ti.
 *
 * Añadir una situación es añadir un objeto aquí: el servidor no sabe nada de
 * esta lista, la recibe en cada petición.
 */
export const SITUACIONES: Situacion[] = [
  {
    id: 'charla',
    emoji: '☕',
    titulo: 'Charla suelta',
    descripcion:
      'A relaxed chat between friends. No agenda: weekend plans, films, work, whatever comes up. Follow her lead.',
    arranque: "Hey, good to see you. So what have you been up to lately?",
  },
  {
    id: 'cafeteria',
    emoji: '🥐',
    titulo: 'En la cafetería',
    descripcion:
      'You are a barista in a busy London coffee shop. She is ordering. Be quick and friendly, ask the usual questions: size, milk, eat in or takeaway.',
    arranque: "Morning! What can I get you today?",
  },
  {
    id: 'aeropuerto',
    emoji: '🛫',
    titulo: 'Viajando',
    descripcion:
      'You work at an airport information desk. She has a problem to sort out: a delayed flight, a lost bag, a gate change. Improvise the details.',
    arranque: "Hi there, you look a bit lost. What's happened?",
  },
  {
    id: 'entrevista',
    emoji: '💼',
    titulo: 'Entrevista de trabajo',
    descripcion:
      'You are interviewing her for a job she wants. Ask real interview questions, one at a time, and follow up on her answers like a real interviewer would.',
    arranque: "Thanks for coming in. To start off, tell me a bit about yourself.",
  },
  {
    id: 'consulta',
    emoji: '🩺',
    titulo: 'En la consulta',
    descripcion:
      'You are a GP in the UK. She has come in about something. Ask about symptoms, how long, what she has tried. Stay in character; do not give real medical advice.',
    arranque: "Come in, take a seat. So, what brings you in today?",
  },
  {
    id: 'piso',
    emoji: '🔑',
    titulo: 'Buscando piso',
    descripcion:
      'You are an estate agent showing her a flat. Talk about rooms, bills, the neighbourhood, the deposit. Be a bit of a salesperson about it.',
    arranque: "So this is the living room. What do you think of the light in here?",
  },
  {
    id: 'discusion',
    emoji: '🔥',
    titulo: 'Llevar la contraria',
    descripcion:
      'A friendly argument. Pick a light topic and take the opposite side to hers. Push back, ask her to justify herself, but keep it warm and funny.',
    arranque: "Right, settle something for me. Is a hot dog a sandwich or not?",
  },
  {
    id: 'trabajo',
    emoji: '💻',
    titulo: 'Reunión de trabajo',
    descripcion:
      'A stand-up with a colleague on a software team. Talk about what she is building, blockers, deadlines. Use normal workplace English, not textbook English.',
    arranque: "Morning. Before we start, how did that deploy go on Friday?",
  },
]

export function buscarSituacion(id: string): Situacion {
  return SITUACIONES.find((s) => s.id === id) ?? SITUACIONES[0]
}
