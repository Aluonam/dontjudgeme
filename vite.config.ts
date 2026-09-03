import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** Un archivo por endpoint en `api/`. Añadir uno es añadirlo aquí. */
const ENDPOINTS = ['chat', 'informe']

/**
 * En producción los archivos de `api/` los sirve la plataforma (Vercel,
 * Netlify…). En desarrollo no hay nadie que lo haga, así que los montamos
 * aquí sobre el propio servidor de Vite: mismos archivos, mismas URL, sin
 * duplicar los manejadores ni levantar un segundo proceso.
 */
function apiEnDesarrollo(modo: string): Plugin {
  return {
    name: 'dontjudgeme:api-en-desarrollo',
    apply: 'serve',

    configResolved() {
      // El SDK lee process.env, y Vite no vuelca ahí las variables sin
      // prefijo VITE_ (justamente para no filtrarlas al navegador).
      Object.assign(process.env, loadEnv(modo, process.cwd(), 'ANTHROPIC'))
    },

    configureServer(servidor) {
      for (const endpoint of ENDPOINTS) {
        servidor.middlewares.use(`/api/${endpoint}`, async (peticion, respuesta) => {
          try {
            const manejador = await cargarManejador(endpoint)
            const salida = await manejador(await aPeticionWeb(peticion))
            await volcar(salida, respuesta)
          } catch (error) {
            respuesta.statusCode = 500
            respuesta.setHeader('content-type', 'application/json')
            respuesta.end(JSON.stringify({ error: String(error) }))
          }
        })
      }
    },
  }
}

/** Se reimporta en cada petición para que los cambios se vean sin reiniciar. */
async function cargarManejador(endpoint: string) {
  const ruta = pathToFileURL(resolve(`api/${endpoint}.ts`)).href
  const modulo = await import(/* @vite-ignore */ `${ruta}?v=${Date.now()}`)
  return modulo.default as (peticion: Request) => Promise<Response>
}

async function aPeticionWeb(peticion: IncomingMessage): Promise<Request> {
  const trozos: Buffer[] = []
  for await (const trozo of peticion) trozos.push(trozo as Buffer)
  return new Request(`http://local${peticion.url ?? '/'}`, {
    method: peticion.method,
    headers: peticion.headers as Record<string, string>,
    body: trozos.length ? Buffer.concat(trozos) : undefined,
  })
}

async function volcar(salida: Response, respuesta: ServerResponse) {
  respuesta.statusCode = salida.status
  salida.headers.forEach((valor, clave) => respuesta.setHeader(clave, valor))
  if (!salida.body) return respuesta.end()
  const lector = salida.body.getReader()
  for (;;) {
    const { done, value } = await lector.read()
    if (done) break
    respuesta.write(value)
  }
  respuesta.end()
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    apiEnDesarrollo(mode),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],

      manifest: {
        name: "don't judge me — inglés hablando",
        short_name: "don't judge me",
        description:
          'Practica inglés hablado: repasas el vocabulario del tema, conversas por notas de voz con una profesora de IA y al colgar recibes un informe.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0e1424',
        theme_color: '#0e1424',
        categories: ['education'],
        icons: [
          { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
          {
            // Android recorta el icono a la forma del sistema; este lleva
            // el dibujo encogido para que no se quede sin bordes.
            src: '/icono-enmascarable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // La conversación necesita red por definición: no tiene sentido
        // cachearla, y una respuesta vieja servida desde caché sería peor
        // que un error honesto. El cuaderno, en cambio, vive en el móvil.
        navigateFallbackDenylist: [/^\/api\//],
      },

      devOptions: { enabled: true, type: 'module' },
    }),
  ],
}))
