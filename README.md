# SpeakUp

PWA para practicar **inglés hablado**: conversaciones de voz en tiempo real con
un interlocutor de IA que además te corrige, te apunta vocabulario y te va
soltando refranes y phrasal verbs.

## Cómo funciona

```
micrófono ──► Web Speech API (navegador)
                    │  texto
                    ▼
            /api/chat ──► Claude (streaming)
                    │  respuesta troceada
                    ▼
        speechSynthesis habla frase a frase
                    │
                    └─► ficha del profesor ──► cuaderno (repaso espaciado)
```

Lo que hace que parezca una conversación y no un chat con altavoz: **la voz
empieza a sonar antes de que el modelo haya terminado de escribir**. El
servidor va emitiendo el texto según llega, el navegador lo corta por frases y
dice cada una en cuanto está completa.

Al final de cada turno el modelo añade, después de un separador, una ficha en
JSON con la corrección, el vocabulario y la expresión que haya usado. Esa ficha
nunca se lee en voz alta: se queda en la tarjeta bajo la burbuja y cae sola en
el cuaderno.

## Arrancar

```bash
npm install
cp .env.example .env.local   # y pega tu clave de Anthropic
npm run dev
```

La clave va **sin** prefijo `VITE_`: solo la lee `api/chat.ts`, en el servidor.
Una variable `VITE_` acabaría empaquetada en el JavaScript que descarga el
navegador, y con ella cualquiera podría gastar tu saldo.

En desarrollo no hay funciones serverless, así que `vite.config.ts` monta
`api/chat.ts` sobre el propio servidor de Vite. Es el mismo archivo que se
despliega: no hay dos versiones del manejador.

## Otros comandos

| Comando          | Qué hace                                              |
| ---------------- | ----------------------------------------------------- |
| `npm run build`  | Compila tipos y genera `dist/` con el service worker   |
| `npm run lint`   | oxlint                                                 |
| `npm run iconos` | Redibuja los PNG de `public/` desde el script          |

## Navegadores

El reconocimiento de voz es la Web Speech API del navegador: se procesa en
local, no sube audio a ningún sitio y no cuesta nada.

| Navegador           | Hablar | Oír |
| ------------------- | ------ | --- |
| Chrome / Edge       | sí     | sí  |
| Chrome Android      | sí     | sí  |
| Safari (iOS/macOS)  | no     | sí  |
| Firefox             | no     | sí  |

Donde no hay micrófono la app ofrece escribir, así que sigue siendo usable;
pero para lo que está pensada es para Chrome o Edge, instalada como app.

Si algún día hace falta que funcione en iPhone, lo que hay que sustituir es
`src/voz/reconocimiento.ts` y nada más: el resto de la app solo conoce esa
interfaz. Ahí es donde entraría un modelo de voz a voz de verdad.

## Cuaderno

Cada corrección, palabra y expresión se guarda como tarjeta y se repasa con
Leitner: cinco cajas, y cada acierto aleja la siguiente revisión (1, 3, 7, 21 y
90 días). Todo vive en el `localStorage` del dispositivo — no hay cuenta ni
servidor de datos — y se puede exportar a JSON desde Ajustes.

## Desplegar

`api/chat.ts` es una función de runtime edge estándar (`Request` → `Response`),
así que en Vercel funciona tal cual: subir el repositorio y añadir
`ANTHROPIC_API_KEY` en las variables de entorno del proyecto.

## Coste

Cada turno reenvía el historial (recortado a los últimos 24 mensajes) y gasta
unos pocos cientos de tokens. El modelo es `claude-opus-5` con esfuerzo `low`,
que es el ajuste de latencia: en una conversación hablada, tardar tres segundos
en contestar se nota más que cualquier mejora de calidad. Ambas cosas se cambian
en las constantes de arriba de `api/chat.ts`.
