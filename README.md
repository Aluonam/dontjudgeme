# don't judge me

PWA para practicar **inglés hablado** sin la vergüenza de hacerlo delante de alguien.

Eliges un tema, repasas su vocabulario, hablas por notas de voz con una
profesora de IA y al colgar recibes un informe con lo que has fallado y lo que
sonaría mejor.

## El ciclo

```
1. Eliges tema        "Escalar un problema"
2. Repasas            12 palabras + 5 expresiones     ← gratis
3. Hablas             notas de voz, estilo WhatsApp
4. Informe            fallos, mejoras y cuánto vocabulario usaste
```

El repaso va **antes** de hablar a propósito. Estudiar vocabulario suelto no
se pega; estudiarlo cinco minutos antes de tener que usarlo, sí. Y esa misma
lista se le pasa a la profesora, que conduce la conversación para que te haga
falta — sin decírtelo nunca.

## Cómo funciona por dentro

```
micrófono ──► Web Speech API (navegador, gratis)
                    │  texto
                    ▼
            /api/chat ──► Claude (streaming)
                    │  respuesta troceada por frases
                    ▼
        speechSynthesis habla frase a frase
                    │
              al colgar
                    ▼
            /api/informe ──► Claude (esfuerzo alto)
                    │
                    └─► informe + vocabulario al cuaderno
```

La API de Claude no procesa audio: el navegador hace de oídos y de boca, y
Claude solo ve texto. Eso hace que hablar y escuchar salgan gratis y que todo
el coste esté en los dos endpoints.

**Lo que hace que parezca una conversación y no un chat con altavoz:** la voz
empieza a sonar antes de que el modelo haya terminado de escribir. El servidor
va emitiendo el texto según llega, el navegador lo corta por frases y dice cada
una en cuanto está completa. Unos 800 ms en lugar de tres segundos.

### Tres decisiones que explican el resto

**No te corrige mientras hablas.** Ni una vez. Interrumpir a un adulto que está
intentando hablar en otro idioma es exactamente lo que hace que deje de
intentarlo. Todo lo que había que decir se dice de golpe en el informe, cuando
ya no interrumpe nada.

**El micrófono se abre porque pulsas y se cierra porque sueltas.** Sin
detección de silencio. Aprendiendo un idioma te paras a pensar, y una app que
interpreta esa pausa como "ya he terminado" te corta justo cuando estabas
construyendo la frase. Mantener para hablar, deslizar arriba para bloquear,
deslizar a la izquierda para cancelar: son los gestos de WhatsApp, que ya te
sabes. En escritorio, la barra espaciadora.

**La transcripción se ve antes de enviarse.** Si el micrófono ha entendido otra
cosa, cancelas y repites. Con envío automático te enterabas cuando la
profesora ya te había contestado a algo que no dijiste.

## El gasto

Cada respuesta de la API devuelve los tokens facturados, así que la app sabe
exactamente lo que lleva gastado y lo enseña siempre, en euros y en
conversaciones restantes. Avisa al 50 %, 80 % y 95 %, y avisa **antes** de
empezar si no queda para una conversación entera.

El presupuesto reserva siempre lo que cuesta el informe final: no puede pasar
que te quedes sin saldo justo antes de la única parte que enseña.

Eso sí, el tope de verdad no es este contador sino el saldo prepago de la
consola de Anthropic. Si cargas cinco euros, cinco euros es lo máximo que puede
gastarse, lo diga esta app o no.

Con una conversación diaria sale sobre 3 €/mes. El repaso del cuaderno no
cuesta nada.

## Arrancar

```bash
npm install
cp .env.example .env.local   # y pega tu clave de Anthropic
npm run dev
```

La clave sale de [console.anthropic.com](https://console.anthropic.com/settings/keys)
y necesita su propio saldo: una suscripción a Claude no da acceso a la API.

Va **sin** prefijo `VITE_`: solo la leen los archivos de `api/`, en el
servidor. Una variable `VITE_` acabaría empaquetada en el JavaScript que
descarga el navegador, y con ella cualquiera podría gastar tu saldo.

En desarrollo no hay funciones serverless, así que `vite.config.ts` monta
`api/*.ts` sobre el propio servidor de Vite. Son los mismos archivos que se
despliegan: no hay dos versiones del manejador.

## Añadir un tema

Un objeto en `src/nucleo/temas.ts` con su vocabulario, sus expresiones y las
funciones comunicativas que entrena. Nada más: el servidor no conoce la lista,
la recibe entera en cada petición.

Las funciones (`opinar`, `discrepar`, `especular`, `matizar`…) son lo que de
verdad se practica. La fluidez B2 no es saber palabras de series, es poder
defender una opinión sin quedarte parada — hables de series o de una
retrospectiva.

## Otros comandos

| Comando          | Qué hace                                            |
| ---------------- | --------------------------------------------------- |
| `npm run build`  | Compila tipos y genera `dist/` con el service worker |
| `npm run lint`   | oxlint                                              |
| `npm run iconos` | Redibuja los PNG de `public/` desde el script        |

## Navegadores

El reconocimiento de voz es la Web Speech API del navegador: se procesa en
local, no sube audio a ningún sitio y no cuesta nada.

| Navegador        | Hablar | Oír |
| ---------------- | ------ | --- |
| Chrome / Edge    | ✅     | ✅  |
| Chrome Android   | ✅     | ✅  |
| Safari / iOS     | ❌     | ✅  |
| Firefox          | ❌     | ✅  |

Donde no hay micrófono, la app ofrece escribir. Todo lo demás funciona igual.

## Tus datos

Todo vive en el `localStorage` del dispositivo: ajustes, cuaderno, informes y
contador de gasto. No hay cuenta, no hay base de datos y no hay servidor de
datos que pinchar — nada que proteger porque nada sale de aquí. El cuaderno se
exporta a JSON desde Ajustes.
