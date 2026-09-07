# Arquitectura

## Mapa

Una carpeta por funcionalidad. `nucleo/` es lógica y datos puros, sin una sola
línea de JSX; `comun/` es lo contrario, componentes que usan dos pantallas o
más. Si algo no encaja en ninguna de las dos, es que pertenece a su
funcionalidad.

```
src/
  nucleo/            el dominio, sin interfaz
    tipos.ts         todo el modelo de datos en un archivo
    temas.ts         el contenido: vocabulario y guiones por tema
    presupuesto.ts   precios, acumulación de gasto y umbrales de aviso
    almacen.ts       localStorage

  comun/
    MedidorGasto.tsx la barra de gasto, en conversación y en ajustes

  temas/             elegir tema y repasarlo antes de hablar
    SelectorTemas.tsx
    Preparacion.tsx

  conversacion/      el turno de palabra
    usarConversacion.ts  quién habla, y el streaming del chat
    Conversacion.tsx
    BotonVoz.tsx     los gestos de la nota de voz

  informe/           lo que llega al colgar
    usarInforme.ts   pide y valida el análisis
    InformeFinal.tsx
    Historial.tsx
    recurrentes.ts   lo que se repite entre informes

  cuaderno/          repetición espaciada (Leitner)
  ajustes/
  voz/               reconocimiento y síntesis del navegador
  sesion/Sesion.tsx  hilvana los cuatro pasos

api/
  chat.ts            un turno de conversación (streaming, esfuerzo bajo)
  informe.ts         el análisis final (salida estructurada, esfuerzo alto)
```

Los dos hooks están separados por la misma razón que los dos endpoints: el de
conversación corre, el del informe acierta. Juntos, un solo archivo llevaba el
micrófono, el streaming y el análisis.

## Los cuatro pasos

```
SelectorTemas ──► Preparacion ──► Conversacion ──► InformeFinal
   elegir           repasar          hablar          leer
   gratis           gratis          /api/chat      /api/informe
```

`Sesion.tsx` es el único sitio que sabe en qué paso estás. Cada pantalla no
sabe nada de las demás.

## Por qué dos endpoints y no uno

Hacen cosas opuestas y necesitan ajustes opuestos:

|              | `/api/chat`            | `/api/informe`             |
| ------------ | ---------------------- | -------------------------- |
| Cuándo       | cada turno             | una vez, al colgar         |
| Prioridad    | latencia               | precisión                  |
| `effort`     | `low`                  | `high`                     |
| Salida       | streaming de texto     | JSON con esquema           |
| `max_tokens` | 400                    | 8000                       |

Meter la corrección en el turno de conversación —que es como estaba antes—
obligaba a un separador en mitad del stream, a retener texto para que el
sintetizador no leyera el separador en voz alta, y a corregir a alguien que
está a mitad de una frase. Separarlos elimina las tres cosas.

## Caché de prompt

El system prompt de `/api/chat` lleva dentro el vocabulario del tema y los
errores recurrentes, así que es largo — y es **idéntico** en todos los turnos
de una conversación. Va marcado con `cache_control`, lo que baja el coste de
entrada a una décima parte y adelanta el primer token.

Como cada turno reenvía el historial entero, esa caché es la diferencia entre
unos 6 €/mes y unos 3 €.

## El turno de palabra

Un solo sitio decide quién habla: `usarConversacion.ts`. Tener eso repartido
entre componentes es la receta segura para que el micrófono y el sintetizador
se pisen.

```
reposo ──pulsar──► grabando ──soltar──► pensando ──► hablando ──► reposo
   ▲                   │                                 │
   └────cancelar───────┘         pulsar (interrumpe) ─────┘
```

No hay transición automática de `hablando` a `grabando`: el micrófono se abre
solo porque tú lo abres.

### El micrófono, en detalle

Chrome corta la sesión de reconocimiento por su cuenta tras unos segundos de
silencio, aunque `continuous` esté puesto. Mientras el botón siga pulsado eso
no es el final del turno: `reconocimiento.ts` la rearranca y sigue acumulando.
Sin eso, pararse a pensar cortaría la frase — que es justo lo que se quería
evitar.

## El gasto

```
respuesta de la API ──► usage (tokens reales)
                          │
                    calcularGasto()      precios en presupuesto.ts
                          │
                      anotar()           suma al periodo
                          │
                  ┌───────┴───────┐
              MedidorGasto    puedeConversar()
              (siempre        (bloquea el micro)
               visible)
```

`cerrarConversacion()` recalcula el coste medio con cada conversación
terminada. Es lo que permite decir "te quedan unas cuatro conversaciones" en
lugar de "te quedan 0,88 €", que no significa nada para nadie.

El periodo es el mes natural y se renueva solo al leer el estado.

## Memoria entre sesiones

`erroresRecurrentes()` mira los últimos seis informes y saca lo que aparece dos
veces o más. Esa lista entra en el prompt de la profesora, que monta
situaciones donde vuelva a salir — sin mencionarlo y sin corregir.

Es la única memoria que hay entre conversaciones, y es deliberado: el resto
empieza limpio cada vez.

## Decisiones que parecen omisiones

**Sin base de datos ni login.** Todo en `localStorage`. Para una app de una
sola usuaria, una tabla de usuarios vacía es complejidad sin contrapartida. El
cuaderno se exporta a JSON, así que no hay nada atrapado.

**Sin framework de estado.** Cuatro `useState` en `App.tsx` y props hacia
abajo. El árbol tiene tres niveles.

**Vite y no Next.js.** Las funciones serverless de la plataforma cubren
`api/*.ts` igual de bien, y el arranque en desarrollo es inmediato.

**Leitner y no FSRS.** Cinco cajas y dos números por tarjeta. FSRS es mejor
algoritmo, pero necesita un historial de repasos que aquí no existiría hasta
dentro de meses.

## Los límites conocidos

**Safari y Firefox no reconocen voz.** La Web Speech API no está en ninguno de
los dos. La app lo detecta y ofrece escribir. Cambiar a Whisper es reescribir
`voz/reconocimiento.ts` y nada más: el resto de la app solo conoce esa
interfaz.

**La latencia no baja de un segundo.** STT del navegador, red, Claude, TTS.
Para bajar de ahí haría falta un modelo de voz a voz nativo, y la API de Claude
procesa texto.

**El coste en euros es aproximado.** Tipo de cambio fijo en `presupuesto.ts`.
Es un medidor, no una factura.
