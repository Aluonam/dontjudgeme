/**
 * Los iconos de la app, dibujados a mano en píxeles.
 *
 * Podrían ser cuatro PNG en el repositorio, pero entonces cambiar el color
 * de la marca sería abrir un editor de imagen. Así se cambia una constante
 * y se ejecuta `npm run iconos`. Sin dependencias: sólo zlib, que ya trae
 * Node, y el formato PNG, que es más simple de lo que parece.
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const FONDO = [0x0e, 0x14, 0x24]
const ACENTO = [0xff, 0xb4, 0x54]

const SALIDA = new URL('../public/', import.meta.url)

/** Cobertura de un rectángulo redondeado, en coordenadas 0..1. */
function enRectangulo(u, v, x0, y0, x1, y1, radio) {
  if (u < x0 || u > x1 || v < y0 || v > y1) return false
  const cx = Math.min(Math.max(u, x0 + radio), x1 - radio)
  const cy = Math.min(Math.max(v, y0 + radio), y1 - radio)
  const dx = u - cx
  const dy = v - cy
  return dx * dx + dy * dy <= radio * radio
}

function enCirculo(u, v, cx, cy, r) {
  const dx = u - cx
  const dy = v - cy
  return dx * dx + dy * dy <= r * r
}

/** El pico del bocadillo: un triángulo por debajo del cuerpo. */
function enPico(u, v) {
  const puntos = [
    [0.34, 0.62],
    [0.29, 0.84],
    [0.52, 0.64],
  ]
  // Dentro del triángulo = los tres productos vectoriales tienen el mismo
  // signo. Comprobar los dos signos ahorra tener que acordarse de en qué
  // sentido están escritos los vértices.
  let positivos = 0
  let negativos = 0
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = puntos[i]
    const [bx, by] = puntos[(i + 1) % 3]
    const lado = (bx - ax) * (v - ay) - (by - ay) * (u - ax)
    if (lado > 0) positivos++
    if (lado < 0) negativos++
  }
  return positivos === 0 || negativos === 0
}

/**
 * @param {number} lado  tamaño en píxeles
 * @param {number} escala  cuánto encoge el dibujo (los iconos enmascarables
 *   necesitan margen porque Android los recorta a la forma del sistema)
 * @param {boolean} esquinas  redondear el lienzo o dejarlo cuadrado
 */
function dibujar(lado, escala, esquinas) {
  const pixeles = Buffer.alloc(lado * lado * 4)
  const MUESTRAS = 3

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      let lienzo = 0
      let bocadillo = 0
      let puntos = 0

      // Supermuestreo: nueve sondas por píxel. Sin esto los bordes curvos
      // salen con escalones muy visibles a 192 píxeles.
      for (let sy = 0; sy < MUESTRAS; sy++) {
        for (let sx = 0; sx < MUESTRAS; sx++) {
          const u = (x + (sx + 0.5) / MUESTRAS) / lado
          const v = (y + (sy + 0.5) / MUESTRAS) / lado

          if (esquinas ? enRectangulo(u, v, 0, 0, 1, 1, 0.22) : true) lienzo++

          // El dibujo se encoge respecto al centro del lienzo.
          const du = 0.5 + (u - 0.5) / escala
          const dv = 0.5 + (v - 0.5) / escala

          if (enRectangulo(du, dv, 0.14, 0.18, 0.86, 0.66, 0.15) || enPico(du, dv)) bocadillo++

          for (const cx of [0.33, 0.5, 0.67]) {
            if (enCirculo(du, dv, cx, 0.42, 0.055)) puntos++
          }
        }
      }

      const total = MUESTRAS * MUESTRAS
      const alfa = lienzo / total
      const mezcla = (i) => {
        const base = FONDO[i]
        const conBocadillo = base + (ACENTO[i] - base) * (bocadillo / total)
        return Math.round(conBocadillo + (base - conBocadillo) * (puntos / total))
      }

      const o = (y * lado + x) * 4
      pixeles[o] = mezcla(0)
      pixeles[o + 1] = mezcla(1)
      pixeles[o + 2] = mezcla(2)
      pixeles[o + 3] = Math.round(alfa * 255)
    }
  }

  return pixeles
}

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc(datos) {
  let c = 0xffffffff
  for (const byte of datos) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const suma = Buffer.alloc(4)
  suma.writeUInt32BE(crc(cuerpo))
  return Buffer.concat([largo, cuerpo, suma])
}

function aPng(pixeles, lado) {
  const cabecera = Buffer.alloc(13)
  cabecera.writeUInt32BE(lado, 0)
  cabecera.writeUInt32BE(lado, 4)
  cabecera[8] = 8 // bits por canal
  cabecera[9] = 6 // RGBA
  // Cada fila del PNG lleva delante un byte de filtro; 0 es "sin filtro".
  const crudo = Buffer.alloc(lado * (lado * 4 + 1))
  for (let y = 0; y < lado; y++) {
    crudo[y * (lado * 4 + 1)] = 0
    pixeles.copy(crudo, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', cabecera),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(SALIDA, { recursive: true })

const iconos = [
  ['icono-192.png', 192, 1, true],
  ['icono-512.png', 512, 1, true],
  ['icono-enmascarable-512.png', 512, 0.68, false],
  ['apple-touch-icon.png', 180, 1, false],
]

for (const [nombre, lado, escala, esquinas] of iconos) {
  writeFileSync(new URL(nombre, SALIDA), aPng(dibujar(lado, escala, esquinas), lado))
  console.log('escrito public/' + nombre)
}
