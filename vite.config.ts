import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * En producción `api/chat.ts` lo sirve la plataforma (Vercel, Netlify…).
 * En desarrollo no hay nadie que lo haga, así que lo montamos aquí sobre
 * el propio servidor de Vite: mismo archivo, misma URL, sin duplicar el
 * manejador ni tener que levantar un segundo proceso.
 */
function apiEnDesarrollo(modo: string): Plugin {
  return {
    name: 'speakup:api-en-desarrollo',
    apply: 'serve',

    configResolved() {
      // El SDK lee process.env, y Vite no vuelca ahí las variables sin
      // prefijo VITE_ (justamente para no filtrarlas al navegador).
      Object.assign(process.env, loadEnv(modo, process.cwd(), 'ANTHROPIC'))
    },

    configureServer(servidor) {
      servidor.middlewares.use('/api/chat', async (peticion, respuesta) => {
        try {
          const manejador = await cargarManejador()
          const salida = await manejador(await aPeticionWeb(peticion))
          await volcar(salida, respuesta)
        } catch (error) {
          respuesta.statusCode = 500
          respuesta.setHeader('content-type', 'application/json')
          respuesta.end(JSON.stringify({ error: String(error) }))
        }
      })
    },
  }
}

/** Se reimporta en cada petición para que los cambios se vean sin reiniciar. */
async function cargarManejador() {
  const ruta = pathToFileURL(resolve('api/chat.ts')).href
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
        name: 'SpeakUp — inglés hablando',
        short_name: 'SpeakUp',
        description:
          'Conversaciones de voz en inglés con un interlocutor de IA, con correcciones, vocabulario y refranes.',
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
