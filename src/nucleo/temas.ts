import type { Tema } from './tipos.ts'

/**
 * Los temas.
 *
 * Cada uno trae su vocabulario y sus expresiones porque los repasas ANTES de
 * hablar: el mazo deja de ser deberes sueltos y pasa a ser la preparación de
 * algo que vas a hacer en cinco minutos. Esa lista se le pasa además al
 * modelo, que conduce la conversación para que te hagan falta.
 *
 * `descripcion` y `arranque` van en inglés: son parte de las instrucciones
 * del tutor y su primera frase. El resto es para ti.
 *
 * Añadir un tema es añadir un objeto aquí. El servidor no conoce esta lista:
 * la recibe entera en cada petición.
 */
export const TEMAS: Tema[] = [
  /* ── Día a día ───────────────────────────────────────────────────────── */
  {
    id: 'que-estas-viendo',
    emoji: '📺',
    titulo: 'Qué estás viendo',
    categoria: 'dia-a-dia',
    nivel: 'B1',
    funciones: ['opinar', 'recomendar', 'narrar'],
    descripcion:
      'Two friends catching up about series and films. Ask what she is watching, whether it is any good, what she gave up on. Share your own opinions and disagree with her sometimes.',
    arranque: "Right, I need something new to watch. What have you been watching lately?",
    vocabulario: [
      { termino: 'binge-watch', significado: 'ver capítulos del tirón', ejemplo: 'I binge-watched the whole season in a weekend.' },
      { termino: 'plot twist', significado: 'giro argumental', ejemplo: 'The plot twist at the end came out of nowhere.' },
      { termino: 'cliffhanger', significado: 'final en suspense', ejemplo: 'They ended on a cliffhanger, so now I have to wait a year.' },
      { termino: 'season finale', significado: 'último capítulo de temporada', ejemplo: 'The season finale was three hours long.' },
      { termino: 'spoiler', significado: 'destripe', ejemplo: "Don't tell me, I haven't finished it — no spoilers." },
      { termino: 'slow burn', significado: 'de ritmo lento que va creciendo', ejemplo: "It's a slow burn, but stick with it." },
      { termino: 'far-fetched', significado: 'inverosímil', ejemplo: 'The plot got a bit far-fetched by season three.' },
      { termino: 'overrated', significado: 'sobrevalorado', ejemplo: 'Honestly, I think it is completely overrated.' },
      { termino: 'gripping', significado: 'que engancha', ejemplo: 'The first two episodes are absolutely gripping.' },
    ],
    expresiones: [
      { frase: "I'm three episodes in", tipo: 'idiom', significado: 'voy por el tercer capítulo', ejemplo: "I'm three episodes in and I'm hooked." },
      { frase: 'it grew on me', tipo: 'idiom', significado: 'me fue gustando poco a poco', ejemplo: 'I hated it at first but it grew on me.' },
      { frase: "I couldn't get into it", tipo: 'idiom', significado: 'no conseguí engancharme', ejemplo: "Everyone loves it but I couldn't get into it." },
      { frase: 'give up on', tipo: 'phrasal', significado: 'abandonar algo', ejemplo: 'I gave up on it halfway through season two.' },
      { frase: 'it went downhill', tipo: 'idiom', significado: 'fue a peor', ejemplo: 'It went downhill after the third season.' },
    ],
  },
  {
    id: 'fin-de-semana',
    emoji: '🌤️',
    titulo: 'El fin de semana',
    categoria: 'dia-a-dia',
    nivel: 'A2',
    funciones: ['narrar', 'describir'],
    descripcion:
      'A relaxed Monday-morning chat about what she did at the weekend and what you did. Keep it light and curious, ask for details.',
    arranque: "Morning! So, how was your weekend? Did you get up to much?",
    vocabulario: [
      { termino: 'a lie-in', significado: 'dormir hasta tarde', ejemplo: 'I had a proper lie-in on Sunday.' },
      { termino: 'errands', significado: 'recados', ejemplo: 'Saturday was just errands, nothing exciting.' },
      { termino: 'to catch up on sleep', significado: 'recuperar sueño', ejemplo: 'I spent Sunday catching up on sleep.' },
      { termino: 'a get-together', significado: 'una quedada', ejemplo: 'We had a small get-together at my place.' },
      { termino: 'knackered', significado: 'hecha polvo (coloquial)', ejemplo: 'I was absolutely knackered by Sunday night.' },
      { termino: 'low-key', significado: 'tranquilo, sin pretensiones', ejemplo: 'It was a low-key weekend, just films and food.' },
    ],
    expresiones: [
      { frase: 'get up to', tipo: 'phrasal', significado: 'hacer, tramar', ejemplo: 'What did you get up to at the weekend?' },
      { frase: 'nothing much', tipo: 'idiom', significado: 'poca cosa', ejemplo: 'Nothing much, just stayed in.' },
      { frase: 'chill out', tipo: 'phrasal', significado: 'relajarse', ejemplo: 'I just chilled out at home.' },
      { frase: 'pop over', tipo: 'phrasal', significado: 'pasarse por casa de alguien', ejemplo: 'My sister popped over on Sunday.' },
      { frase: 'it flew by', tipo: 'idiom', significado: 'se pasó volando', ejemplo: 'The weekend absolutely flew by.' },
    ],
  },
  {
    id: 'viajes-y-vacaciones',
    emoji: '✈️',
    titulo: 'Viajes y vacaciones',
    categoria: 'dia-a-dia',
    nivel: 'B1',
    funciones: ['narrar', 'recomendar', 'comparar'],
    descripcion:
      'Talking about holidays: where she has been, where she wants to go, what went wrong on a trip. Compare travel styles — you are a planner, tease her if she is not.',
    arranque: "So have you got anything booked? I'm desperate for a proper holiday.",
    vocabulario: [
      { termino: 'a stopover', significado: 'escala', ejemplo: 'We had a six-hour stopover in Lisbon.' },
      { termino: 'off the beaten track', significado: 'fuera de las rutas turísticas', ejemplo: 'We stayed somewhere off the beaten track.' },
      { termino: 'a package deal', significado: 'paquete cerrado', ejemplo: 'We went for a package deal, flights and hotel together.' },
      { termino: 'jet-lagged', significado: 'con jet lag', ejemplo: 'I was jet-lagged for about three days.' },
      { termino: 'touristy', significado: 'demasiado turístico', ejemplo: 'The old town was lovely but very touristy.' },
      { termino: 'a hidden gem', significado: 'una joya escondida', ejemplo: 'That little restaurant was a hidden gem.' },
      { termino: 'to be overbooked', significado: 'estar sobrevendido', ejemplo: 'The flight was overbooked and they bumped us.' },
    ],
    expresiones: [
      { frase: 'get away', tipo: 'phrasal', significado: 'escaparse de vacaciones', ejemplo: 'We are trying to get away for a few days in May.' },
      { frase: 'set off', tipo: 'phrasal', significado: 'ponerse en camino', ejemplo: 'We set off at five in the morning.' },
      { frase: 'a change of scenery', tipo: 'idiom', significado: 'un cambio de aires', ejemplo: 'I just need a change of scenery.' },
      { frase: 'it cost a fortune', tipo: 'idiom', significado: 'costó un dineral', ejemplo: 'August flights cost a fortune.' },
      { frase: 'live out of a suitcase', tipo: 'idiom', significado: 'vivir con la maleta a cuestas', ejemplo: 'I spent a month living out of a suitcase.' },
    ],
  },

  /* ── Opinión y debate ────────────────────────────────────────────────── */
  {
    id: 'teletrabajo',
    emoji: '🏠',
    titulo: 'Teletrabajo, ¿sí o no?',
    categoria: 'opinion',
    nivel: 'B2',
    funciones: ['opinar', 'discrepar', 'matizar'],
    descripcion:
      'A friendly argument about remote work. Take the OPPOSITE side to whatever she says, politely but firmly, so she has to defend her position. Push back on vague answers and ask for examples.',
    arranque: "Honestly, I think remote work has been a disaster for junior people. Am I wrong?",
    vocabulario: [
      { termino: 'burnout', significado: 'agotamiento laboral', ejemplo: 'Remote work can hide burnout until it is too late.' },
      { termino: 'a commute', significado: 'el trayecto al trabajo', ejemplo: 'I got two hours of my life back when the commute went.' },
      { termino: 'onboarding', significado: 'incorporación de alguien nuevo', ejemplo: 'Onboarding remotely is genuinely hard.' },
      { termino: 'presenteeism', significado: 'calentar la silla', ejemplo: 'The office just rewarded presenteeism.' },
      { termino: 'to blur', significado: 'difuminar', ejemplo: 'It blurs the line between work and home.' },
      { termino: 'accountability', significado: 'rendición de cuentas', ejemplo: 'It is about accountability, not location.' },
      { termino: 'a trade-off', significado: 'una contrapartida', ejemplo: 'Every setup has a trade-off.' },
    ],
    expresiones: [
      { frase: 'I take your point, but', tipo: 'idiom', significado: 'entiendo lo que dices, pero', ejemplo: 'I take your point, but that only works for senior people.' },
      { frase: "to play devil's advocate", tipo: 'idiom', significado: 'hacer de abogado del diablo', ejemplo: "Just to play devil's advocate for a second…" },
      { frase: 'up to a point', tipo: 'idiom', significado: 'hasta cierto punto', ejemplo: 'I agree, up to a point.' },
      { frase: 'that is a fair point', tipo: 'idiom', significado: 'ahí llevas razón', ejemplo: 'That is a fair point, I had not thought of that.' },
      { frase: 'to be honest with you', tipo: 'idiom', significado: 'si te soy sincera', ejemplo: 'To be honest with you, I miss the office a bit.' },
    ],
  },
  {
    id: 'ia-y-empleo',
    emoji: '🤖',
    titulo: 'La IA y el empleo',
    categoria: 'opinion',
    nivel: 'B2',
    funciones: ['opinar', 'especular', 'matizar'],
    descripcion:
      'A debate about whether AI will replace jobs, especially in her field. She works in web development and project management, so make it concrete and personal. Challenge easy answers in both directions.',
    arranque: "Everyone keeps telling me AI is coming for our jobs. Do you actually believe that?",
    vocabulario: [
      { termino: 'to automate', significado: 'automatizar', ejemplo: 'You can automate the boring half of the job.' },
      { termino: 'to be made redundant', significado: 'ser despedida por reestructuración', ejemplo: 'Two people on my team were made redundant.' },
      { termino: 'to reskill', significado: 'reciclarse profesionalmente', ejemplo: 'People will have to reskill, not disappear.' },
      { termino: 'hype', significado: 'exageración, bombo', ejemplo: 'There is a lot of hype and not much evidence.' },
      { termino: 'a bottleneck', significado: 'cuello de botella', ejemplo: 'Writing code was never the bottleneck.' },
      { termino: 'entry-level', significado: 'de nivel inicial', ejemplo: 'It hits entry-level roles hardest.' },
      { termino: 'to augment', significado: 'potenciar, complementar', ejemplo: 'It augments the work rather than replacing it.' },
    ],
    expresiones: [
      { frase: 'the jury is still out', tipo: 'idiom', significado: 'todavía está por ver', ejemplo: 'The jury is still out on how much it really helps.' },
      { frase: 'to jump on the bandwagon', tipo: 'idiom', significado: 'apuntarse a la moda', ejemplo: 'Every company jumped on the bandwagon.' },
      { frase: 'at the end of the day', tipo: 'idiom', significado: 'a fin de cuentas', ejemplo: 'At the end of the day, someone has to decide what to build.' },
      { frase: 'to be a double-edged sword', tipo: 'idiom', significado: 'ser un arma de doble filo', ejemplo: 'It is a double-edged sword.' },
      { frase: 'time will tell', tipo: 'refran', significado: 'el tiempo lo dirá', ejemplo: 'Time will tell, I suppose.' },
    ],
  },

  /* ── Contar y suponer ────────────────────────────────────────────────── */
  {
    id: 'peor-viaje',
    emoji: '🧳',
    titulo: 'El peor viaje de tu vida',
    categoria: 'narrar',
    nivel: 'B1',
    funciones: ['narrar', 'describir'],
    descripcion:
      'Swapping travel disaster stories. Tell her one of yours first — make it vivid and funny — then get hers. Ask what happened next, keep the story moving.',
    arranque: "I once slept on an airport floor in Milan for eleven hours. Beat that.",
    vocabulario: [
      { termino: 'to get stranded', significado: 'quedarse tirada', ejemplo: 'We got stranded in Rome for two days.' },
      { termino: 'to miss a connection', significado: 'perder un enlace', ejemplo: 'We missed our connection by ten minutes.' },
      { termino: 'a nightmare', significado: 'una pesadilla', ejemplo: 'The whole trip was a nightmare.' },
      { termino: 'to lose your luggage', significado: 'perder el equipaje', ejemplo: 'The airline lost my luggage for a week.' },
      { termino: 'to break down', significado: 'averiarse', ejemplo: 'The car broke down in the middle of nowhere.' },
      { termino: 'in hindsight', significado: 'visto en retrospectiva', ejemplo: 'In hindsight, we should have left earlier.' },
    ],
    expresiones: [
      { frase: 'to go from bad to worse', tipo: 'idiom', significado: 'ir de mal en peor', ejemplo: 'And then it went from bad to worse.' },
      { frase: 'in the middle of nowhere', tipo: 'idiom', significado: 'en mitad de la nada', ejemplo: 'We ended up in the middle of nowhere.' },
      { frase: 'to end up', tipo: 'phrasal', significado: 'acabar (de cierta manera)', ejemplo: 'We ended up sleeping in the car.' },
      { frase: 'looking back on it', tipo: 'idiom', significado: 'mirándolo ahora', ejemplo: 'Looking back on it, it is quite funny.' },
      { frase: 'to turn out', tipo: 'phrasal', significado: 'resultar', ejemplo: 'It turned out the hotel did not exist.' },
    ],
  },
  {
    id: 'si-te-tocara',
    emoji: '🎰',
    titulo: 'Si te tocara la lotería',
    categoria: 'narrar',
    nivel: 'B2',
    funciones: ['especular', 'opinar'],
    descripcion:
      'A hypothetical chat: the lottery, quitting your job, moving abroad, what you would do differently. Push her towards second and third conditionals by asking follow-ups like "and what if that did not work?".',
    arranque: "Serious question. If you won a stupid amount of money tomorrow, would you still work?",
    vocabulario: [
      { termino: 'to hand in your notice', significado: 'presentar la dimisión', ejemplo: 'I would hand in my notice the same day.' },
      { termino: 'a nest egg', significado: 'unos ahorros para el futuro', ejemplo: 'I would put half of it away as a nest egg.' },
      { termino: 'to splash out on', significado: 'darse un capricho caro', ejemplo: 'I would splash out on a proper holiday.' },
      { termino: 'to invest', significado: 'invertir', ejemplo: 'I would invest most of it, honestly.' },
      { termino: 'to retrain', significado: 'reciclarse', ejemplo: 'I would retrain as something completely different.' },
      { termino: 'financially secure', significado: 'con la vida resuelta', ejemplo: 'I just want to be financially secure.' },
    ],
    expresiones: [
      { frase: 'if I were you', tipo: 'idiom', significado: 'yo que tú', ejemplo: 'If I were you, I would not tell anyone.' },
      { frase: 'I would rather', tipo: 'idiom', significado: 'preferiría', ejemplo: 'I would rather work part-time than not at all.' },
      { frase: 'to be tempted to', tipo: 'idiom', significado: 'estar tentada de', ejemplo: 'I would be tempted to move abroad.' },
      { frase: 'money does not grow on trees', tipo: 'refran', significado: 'el dinero no crece en los árboles', ejemplo: 'My mother always said money does not grow on trees.' },
      { frase: 'to have second thoughts', tipo: 'idiom', significado: 'replantearse algo', ejemplo: 'I would probably have second thoughts.' },
    ],
  },

  /* ── Trabajo ─────────────────────────────────────────────────────────── */
  {
    id: 'daily-standup',
    emoji: '📋',
    titulo: 'Daily standup',
    categoria: 'trabajo',
    nivel: 'B1',
    funciones: ['explicar', 'describir'],
    descripcion:
      'You are running a daily standup on a distributed dev team. Ask her for yesterday, today and blockers. React like a real lead: dig into the blocker, offer help, keep it to a couple of minutes.',
    arranque: "Morning everyone. Let's keep this short — do you want to kick us off?",
    vocabulario: [
      { termino: 'a blocker', significado: 'un impedimento', ejemplo: 'My only blocker is waiting on the design review.' },
      { termino: 'to be blocked on', significado: 'estar bloqueada por', ejemplo: 'I am blocked on the API credentials.' },
      { termino: 'a ticket', significado: 'una tarea del tablero', ejemplo: 'I picked up the ticket about the login bug.' },
      { termino: 'to pick up', significado: 'coger una tarea', ejemplo: 'I will pick that up this afternoon.' },
      { termino: 'a hotfix', significado: 'un parche urgente', ejemplo: 'We shipped a hotfix last night.' },
      { termino: 'to deploy', significado: 'desplegar', ejemplo: 'We deploy on Thursdays.' },
      { termino: 'a regression', significado: 'una regresión', ejemplo: 'That change caused a regression in checkout.' },
    ],
    expresiones: [
      { frase: 'to loop someone in', tipo: 'phrasal', significado: 'poner a alguien al tanto', ejemplo: 'I will loop you in on that thread.' },
      { frase: 'to circle back', tipo: 'phrasal', significado: 'retomarlo después', ejemplo: 'Let us circle back after standup.' },
      { frase: 'to raise a flag', tipo: 'idiom', significado: 'dar la voz de alarma', ejemplo: 'I want to raise a flag on the deadline.' },
      { frase: 'to take it offline', tipo: 'idiom', significado: 'hablarlo aparte', ejemplo: 'Shall we take that one offline?' },
      { frase: 'on track', tipo: 'idiom', significado: 'según lo previsto', ejemplo: 'We are still on track for Friday.' },
    ],
  },
  {
    id: 'gestion-del-calendario',
    emoji: '📅',
    titulo: 'Gestión del calendario',
    categoria: 'trabajo',
    nivel: 'B1',
    funciones: ['negociar', 'matizar'],
    descripcion:
      'You are a colleague in another timezone trying to find a slot for a workshop. Your calendar is a mess. Propose times, clash with her, move things around, and make her push back and negotiate.',
    arranque: "I'm trying to get this workshop in the diary. Does Thursday morning work for you at all?",
    vocabulario: [
      { termino: 'a slot', significado: 'un hueco', ejemplo: 'Have you got a slot on Wednesday?' },
      { termino: 'to double-book', significado: 'solapar dos citas', ejemplo: 'Sorry, I have double-booked myself.' },
      { termino: 'a clash', significado: 'un solape', ejemplo: 'There is a clash with the sprint review.' },
      { termino: 'to reschedule', significado: 'reprogramar', ejemplo: 'Can we reschedule for next week?' },
      { termino: 'back-to-back', significado: 'una reunión detrás de otra', ejemplo: 'I am back-to-back until three.' },
      { termino: 'to block out time', significado: 'bloquear tiempo en la agenda', ejemplo: 'I will block out an hour on Friday.' },
      { termino: 'tentative', significado: 'provisional', ejemplo: 'Let us pencil in a tentative time.' },
    ],
    expresiones: [
      { frase: 'to pencil something in', tipo: 'idiom', significado: 'apuntarlo provisionalmente', ejemplo: 'Shall I pencil you in for Tuesday?' },
      { frase: 'to push back', tipo: 'phrasal', significado: 'retrasar algo, o negarse', ejemplo: 'Can we push it back an hour?' },
      { frase: 'to free up', tipo: 'phrasal', significado: 'liberar tiempo', ejemplo: 'I can free up some time on Thursday.' },
      { frase: 'does that work for you', tipo: 'idiom', significado: '¿te viene bien?', ejemplo: 'Ten thirty — does that work for you?' },
      { frase: 'I am afraid I cannot make it', tipo: 'idiom', significado: 'me temo que no puedo', ejemplo: 'I am afraid I cannot make it that early.' },
    ],
  },
  {
    id: 'escalar-un-problema',
    emoji: '🚨',
    titulo: 'Escalar un problema',
    categoria: 'trabajo',
    nivel: 'B2',
    funciones: ['explicar', 'negociar', 'matizar'],
    descripcion:
      'You are her manager. Something has gone wrong on her project and she has to tell you: what happened, the impact, and what she proposes. Be calm but ask hard questions — cost, timeline, who else is affected.',
    arranque: "You said you needed a word. What's happened?",
    vocabulario: [
      { termino: 'to escalate', significado: 'escalar un asunto', ejemplo: 'I think we need to escalate this today.' },
      { termino: 'the impact', significado: 'las consecuencias', ejemplo: 'The impact is about two weeks of delay.' },
      { termino: 'a root cause', significado: 'la causa raíz', ejemplo: 'The root cause was a missing migration.' },
      { termino: 'a workaround', significado: 'una solución provisional', ejemplo: 'We have a workaround for now.' },
      { termino: 'to mitigate', significado: 'mitigar', ejemplo: 'Here is how we mitigate it.' },
      { termino: 'scope creep', significado: 'ampliación descontrolada del alcance', ejemplo: 'Honestly, it was scope creep.' },
      { termino: 'a contingency', significado: 'un plan de reserva', ejemplo: 'We built in a contingency for this.' },
    ],
    expresiones: [
      { frase: 'to give you a heads-up', tipo: 'idiom', significado: 'avisarte con antelación', ejemplo: 'I wanted to give you a heads-up before the meeting.' },
      { frase: 'to be on the back foot', tipo: 'idiom', significado: 'estar a la defensiva', ejemplo: 'It has put us on the back foot.' },
      { frase: 'to get ahead of it', tipo: 'idiom', significado: 'adelantarse al problema', ejemplo: 'I would rather get ahead of it than explain it later.' },
      { frase: 'to buy some time', tipo: 'idiom', significado: 'ganar tiempo', ejemplo: 'That would buy us a week.' },
      { frase: 'worst-case scenario', tipo: 'idiom', significado: 'en el peor de los casos', ejemplo: 'Worst-case scenario, we slip to the next release.' },
    ],
  },
  {
    id: 'entrevista-tecnica',
    emoji: '💼',
    titulo: 'Entrevista técnica',
    categoria: 'trabajo',
    nivel: 'B2',
    funciones: ['explicar', 'narrar', 'opinar'],
    descripcion:
      'You are interviewing her for a front-end / project role at a mid-size company. Ask about a project she is proud of, a decision she regrets, and how she handles disagreement. Be warm but do not accept vague answers — ask for specifics.',
    arranque: "Thanks for making the time. So, tell me a bit about what you're working on at the moment.",
    vocabulario: [
      { termino: 'a stakeholder', significado: 'parte interesada', ejemplo: 'I had to manage three stakeholders with different priorities.' },
      { termino: 'to take ownership of', significado: 'responsabilizarse de', ejemplo: 'I took ownership of the whole release process.' },
      { termino: 'trade-offs', significado: 'compromisos, contrapartidas', ejemplo: 'We had to weigh up the trade-offs.' },
      { termino: 'to ship', significado: 'sacar a producción', ejemplo: 'We shipped it in six weeks.' },
      { termino: 'legacy code', significado: 'código heredado', ejemplo: 'Most of it was legacy code with no tests.' },
      { termino: 'a proof of concept', significado: 'una prueba de concepto', ejemplo: 'I built a proof of concept first.' },
      { termino: 'to iterate', significado: 'iterar', ejemplo: 'We iterated on it with real users.' },
    ],
    expresiones: [
      { frase: 'to get buy-in', tipo: 'idiom', significado: 'conseguir que se sumen', ejemplo: 'The hard part was getting buy-in from the team.' },
      { frase: 'to walk someone through', tipo: 'phrasal', significado: 'explicar paso a paso', ejemplo: 'Let me walk you through how it worked.' },
      { frase: 'a steep learning curve', tipo: 'idiom', significado: 'una curva de aprendizaje dura', ejemplo: 'It was a steep learning curve.' },
      { frase: 'to hit the ground running', tipo: 'idiom', significado: 'empezar a pleno rendimiento', ejemplo: 'I hit the ground running in that role.' },
      { frase: 'in a nutshell', tipo: 'idiom', significado: 'en pocas palabras', ejemplo: 'In a nutshell, we halved the load time.' },
    ],
  },
  {
    id: 'update-a-stakeholders',
    emoji: '📊',
    titulo: 'Update a stakeholders',
    categoria: 'trabajo',
    nivel: 'B2',
    funciones: ['explicar', 'matizar', 'negociar'],
    descripcion:
      'You are a non-technical stakeholder — a business director. She is updating you on a project that is running late. You do not understand jargon: every time she uses a technical term, ask her what it means in plain English.',
    arranque: "Thanks for the update slot. Give me the headline first — are we going to make the date?",
    vocabulario: [
      { termino: 'a milestone', significado: 'un hito', ejemplo: 'We hit the second milestone last week.' },
      { termino: 'a deliverable', significado: 'un entregable', ejemplo: 'The next deliverable is the reporting module.' },
      { termino: 'to slip', significado: 'retrasarse', ejemplo: 'The date has slipped by two weeks.' },
      { termino: 'a dependency', significado: 'una dependencia', ejemplo: 'We have a dependency on the payments team.' },
      { termino: 'the critical path', significado: 'la ruta crítica', ejemplo: 'That task is on the critical path.' },
      { termino: 'to descope', significado: 'sacar del alcance', ejemplo: 'We could descope the dashboard for now.' },
      { termino: 'in plain English', significado: 'en cristiano', ejemplo: 'Can you tell me that in plain English?' },
    ],
    expresiones: [
      { frase: 'to give you the headline', tipo: 'idiom', significado: 'darte el titular', ejemplo: 'To give you the headline: we need two more weeks.' },
      { frase: 'to flag a risk', tipo: 'idiom', significado: 'señalar un riesgo', ejemplo: 'I want to flag a risk before we commit.' },
      { frase: 'a ballpark figure', tipo: 'idiom', significado: 'una cifra aproximada', ejemplo: 'A ballpark figure would be around three weeks.' },
      { frase: 'to keep you in the loop', tipo: 'idiom', significado: 'mantenerte informada', ejemplo: 'I will keep you in the loop.' },
      { frase: 'to manage expectations', tipo: 'idiom', significado: 'ajustar expectativas', ejemplo: 'I would rather manage expectations now.' },
    ],
  },

  /* ── Social en el trabajo ────────────────────────────────────────────── */
  {
    id: 'el-finde-del-cliente',
    emoji: '☕',
    titulo: 'El finde del cliente',
    categoria: 'puente',
    nivel: 'B1',
    funciones: ['narrar', 'matizar'],
    descripcion:
      'The five minutes before a client call actually starts. You are the client, British, friendly. Small talk only: the weekend, the weather, holidays. Do NOT move to business — if she tries, keep chatting a little longer. This is the bit Spanish speakers skip and it is the bit that builds the relationship.',
    arranque: "Hi! Give it a minute, I think Marc is still joining. Did you have a good weekend?",
    vocabulario: [
      { termino: 'to catch up', significado: 'ponerse al día', ejemplo: 'Good to catch up before we start.' },
      { termino: 'hectic', significado: 'ajetreado', ejemplo: 'It has been a hectic week.' },
      { termino: 'to be snowed under', significado: 'estar hasta arriba', ejemplo: 'I have been snowed under all month.' },
      { termino: 'to make the most of', significado: 'aprovechar al máximo', ejemplo: 'We made the most of the sunshine.' },
      { termino: 'a bank holiday', significado: 'un festivo', ejemplo: 'It is a bank holiday here on Monday.' },
    ],
    expresiones: [
      { frase: 'how have you been', tipo: 'idiom', significado: '¿qué tal te ha ido?', ejemplo: 'How have you been since we last spoke?' },
      { frase: 'not too bad, thanks', tipo: 'idiom', significado: 'no me quejo', ejemplo: 'Not too bad, thanks — busy, but good.' },
      { frase: 'to have a lot on', tipo: 'idiom', significado: 'tener mucho lío', ejemplo: 'I have had a lot on this week.' },
      { frase: 'shall we make a start', tipo: 'idiom', significado: '¿empezamos?', ejemplo: 'Right, shall we make a start?' },
      { frase: 'lovely to speak to you', tipo: 'idiom', significado: 'un placer hablar contigo', ejemplo: 'Lovely to speak to you, as always.' },
    ],
  },

  /* ── Curiosidad ──────────────────────────────────────────────────────── */
  {
    id: 'animales-marinos',
    emoji: '🐙',
    titulo: 'Animales marinos',
    categoria: 'curiosidad',
    nivel: 'B1',
    funciones: ['describir', 'explicar'],
    descripcion:
      'An enthusiastic chat about sea creatures — octopuses, whales, the deep sea. Ask her to describe animals she does not know the English name for, and give her the word when she gets stuck. This is deliberately vocabulary she does not have: the point is practising describing your way around a missing word.',
    arranque: "Did you know octopuses have three hearts? What's the strangest sea creature you've ever seen?",
    vocabulario: [
      { termino: 'a shoal', significado: 'un banco de peces', ejemplo: 'A whole shoal of fish went past.' },
      { termino: 'tentacles', significado: 'tentáculos', ejemplo: 'It has eight tentacles.' },
      { termino: 'a shell', significado: 'una concha, un caparazón', ejemplo: 'It hides inside its shell.' },
      { termino: 'to camouflage', significado: 'camuflarse', ejemplo: 'They camouflage themselves against the rocks.' },
      { termino: 'the seabed', significado: 'el fondo marino', ejemplo: 'It lives on the seabed.' },
      { termino: 'a predator', significado: 'un depredador', ejemplo: 'Sharks are not the only predators down there.' },
      { termino: 'a jellyfish', significado: 'una medusa', ejemplo: 'I got stung by a jellyfish once.' },
      { termino: 'endangered', significado: 'en peligro de extinción', ejemplo: 'A lot of them are endangered now.' },
    ],
    expresiones: [
      { frase: 'it is a bit like', tipo: 'idiom', significado: 'es algo parecido a', ejemplo: 'It is a bit like a squid, but smaller.' },
      { frase: 'the thing that', tipo: 'idiom', significado: 'esa cosa que', ejemplo: 'You know the thing that lights up in the dark?' },
      { frase: 'I cannot think of the word', tipo: 'idiom', significado: 'no me sale la palabra', ejemplo: 'I cannot think of the word — the flat one?' },
      { frase: 'to wash up', tipo: 'phrasal', significado: 'llegar a la orilla', ejemplo: 'A whale washed up on the beach.' },
      { frase: 'plenty more fish in the sea', tipo: 'refran', significado: 'hay muchos más peces en el mar', ejemplo: 'Plenty more fish in the sea, as they say.' },
    ],
  },
]

export const TEMA_POR_DEFECTO = TEMAS[0].id

export function buscarTema(id: string): Tema {
  return TEMAS.find((t) => t.id === id) ?? TEMAS[0]
}

export function temasPorCategoria(categoria: string): Tema[] {
  return TEMAS.filter((t) => t.categoria === categoria)
}

/** Todo lo que hay que llevarse estudiado, en una sola lista. */
export function terminosDe(tema: Tema): string[] {
  return [...tema.vocabulario.map((v) => v.termino), ...tema.expresiones.map((e) => e.frase)]
}
