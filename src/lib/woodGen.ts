// Procedural wood texture generator. Pure function over a pixel buffer so it
// can run inside a Web Worker. u = across the grain (mm), v = along it (mm).

import type { WoodLook } from '../data/woods'

class Noise {
  private perm = new Uint8Array(512)
  private gx = new Float32Array(256)
  private gy = new Float32Array(256)
  constructor(seed: number) {
    let s = (seed * 9301 + 49297) % 233280 || 1
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    const p = new Uint8Array(256)
    for (let i = 0; i < 256; i++) p[i] = i
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      const t = p[i]
      p[i] = p[j]
      p[j] = t
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]
    for (let i = 0; i < 256; i++) {
      const a = rnd() * Math.PI * 2
      this.gx[i] = Math.cos(a)
      this.gy[i] = Math.sin(a)
    }
  }
  /** Gradient noise in [-1, 1]. */
  n(x: number, y: number): number {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const X = xi & 255
    const Y = yi & 255
    const p = this.perm
    const a = p[p[X] + Y]
    const b = p[p[X + 1] + Y]
    const c = p[p[X] + Y + 1]
    const d = p[p[X + 1] + Y + 1]
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    const ga = this.gx[a] * xf + this.gy[a] * yf
    const gb = this.gx[b] * (xf - 1) + this.gy[b] * yf
    const gc = this.gx[c] * xf + this.gy[c] * (yf - 1)
    const gd = this.gx[d] * (xf - 1) + this.gy[d] * (yf - 1)
    const x1 = ga + (gb - ga) * u
    const x2 = gc + (gd - gc) * u
    return (x1 + (x2 - x1) * v) * 1.41
  }
  fbm(x: number, y: number, oct = 3): number {
    let s = 0
    let a = 0.5
    let f = 1
    for (let i = 0; i < oct; i++) {
      s += a * this.n(x * f, y * f)
      f *= 2.03
      a *= 0.5
    }
    return s
  }
}

function hex(c: string): [number, number, number] {
  const v = parseInt(c.replace('#', ''), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

const ss = (e0: number, e1: number, x: number) => {
  const t = x < e0 ? 0 : x > e1 ? 1 : (x - e0) / (e1 - e0)
  return t * t * (3 - 2 * t)
}

export interface WoodGenRequest {
  look: WoodLook
  seed: number
  figure: number
  widthMm: number
  heightMm: number
  pxPerMm: number
}

export function generateWood(req: WoodGenRequest): { width: number; height: number; data: Uint8ClampedArray } {
  const { look, seed, figure, widthMm, heightMm, pxPerMm } = req
  const W = Math.round(widthMm * pxPerMm)
  const H = Math.round(heightMm * pxPerMm)
  const data = new Uint8ClampedArray(W * H * 4)
  const N = new Noise(seed + 17)
  const N2 = new Noise(seed * 3 + 101)
  const L = hex(look.light)
  const D = hex(look.dark)
  const fig = look.figure
  const figS = look.figureStrength * figure
  const fScale = look.figureScale
  const ringPerMm = look.grainFreq / 10
  const ox = (seed % 97) * 13.7
  const oy = (seed % 89) * 7.3
  const coneX = widthMm * (0.35 + ((seed % 7) / 7) * 0.3)
  const coneH = 18 + (seed % 11) * 4

  // Birdseye cells
  const eyeCell = 9 * fScale
  const cellRand = (cx: number, cy: number) => {
    const h = Math.sin(cx * 127.1 + cy * 311.7 + seed) * 43758.5453
    const h2 = Math.sin(cx * 269.5 + cy * 183.3 + seed * 1.3) * 43758.5453
    return [h - Math.floor(h), h2 - Math.floor(h2)]
  }

  for (let py = 0; py < H; py++) {
    const v = py / pxPerMm + oy
    for (let px = 0; px < W; px++) {
      const u = px / pxPerMm + ox
      // Domain warp gives the grain lines their gentle wander.
      const warp = N.fbm(u * 0.012, v * 0.0035, 3) * 26 * look.waviness + N2.n(u * 0.05, v * 0.01) * 2.5 * look.waviness
      let uu = u - ox - coneX + warp
      let vv = v
      if (fig === 'burl') {
        const bw = 22 * figS
        uu += N2.fbm(u * 0.03, v * 0.03, 3) * bw
        vv += N.fbm(u * 0.03 + 9, v * 0.03, 3) * bw * 3
      }
      const r = Math.sqrt(uu * uu + coneH * coneH) - vv * look.cathedral * 0.09
      const ring = r * ringPerMm + N.n(u * 0.2, v * 0.02) * 0.08
      const fr = ring - Math.floor(ring)
      // Latewood: darker band at the end of each growth ring.
      let g = ss(0.62, 0.92, fr) * (1 - ss(0.95, 1.0, fr)) * look.grainContrast
      g += N.n(u * 0.9, v * 0.07) * 0.06 * look.grainContrast

      let t = 0.32 + g
      // Long colour streaks / mineral lines
      t += N2.fbm(u * 0.025, v * 0.002, 2) * look.streaks * 0.6
      // Soft overall variation
      t += N.fbm(u * 0.004 + 3, v * 0.002 + 5, 2) * 0.12

      let bright = 1
      if (figS > 0) {
        if (fig === 'flame') {
          const lean = N.fbm(u * 0.006, v * 0.006, 2) * 40
          const p = (v + lean + N2.n(u * 0.03, v * 0.05) * 5 * fScale + Math.abs(u - widthMm / 2) * 0.12) / (7 * fScale)
          const s = Math.sin(p * Math.PI * 2)
          const band = Math.sign(s) * Math.pow(Math.abs(s), 0.7)
          const env = 0.55 + 0.45 * N2.fbm(u * 0.01, v * 0.004, 2)
          bright *= 1 + band * 0.22 * figS * env
          t += band * 0.1 * figS * env
        } else if (fig === 'quilt') {
          const q1 = N.n(u * 0.05 * (1 / fScale) + 4, v * 0.022 * (1 / fScale))
          const q2 = N2.n(u * 0.09 / fScale, v * 0.045 / fScale)
          const q = Math.sin((q1 * 2.6 + q2 * 0.9) * Math.PI * 2)
          bright *= 1 + q * 0.2 * figS
          t += q * 0.09 * figS
        } else if (fig === 'birdseye') {
          const gx = Math.floor(u / eyeCell)
          const gy = Math.floor(v / eyeCell)
          let dmin = 99
          for (let ix = -1; ix <= 1; ix++)
            for (let iy = -1; iy <= 1; iy++) {
              const [rx, ry] = cellRand(gx + ix, gy + iy)
              const ex = (gx + ix + rx) * eyeCell
              const ey = (gy + iy + ry) * eyeCell
              const dd = Math.hypot((u - ex) * 1.0, (v - ey) * 0.75)
              if (dd < dmin) dmin = dd
            }
          const eye = Math.exp(-(dmin * dmin) / 0.9)
          const halo = Math.exp(-Math.pow((dmin - 1.6) / 0.7, 2))
          t += (eye * 0.55 - halo * 0.12) * figS
          bright *= 1 + halo * 0.08 * figS
        } else if (fig === 'spalted') {
          let line = 0
          for (let k = 0; k < 4; k++) {
            const f = k < 2 ? 0.007 : 0.016
            const nv = N2.fbm(u * f + k * 31, v * f * 0.8 + k * 17, 3)
            const w = k < 2 ? 0.012 : 0.008
            line = Math.max(line, (1 - ss(0.0, w, Math.abs(nv - (k - 1.5) * 0.12))) * (k < 2 ? 1 : 0.6))
          }
          const blotch = ss(0.15, 0.55, N.fbm(u * 0.01 + 50, v * 0.008, 3))
          t += line * 0.95 * figS + blotch * 0.1 * figS
          bright *= 1 - blotch * 0.03
        } else if (fig === 'burl') {
          const eyes = ss(0.62, 0.75, N2.n(u * 0.35, v * 0.35)) * ss(0.0, 0.4, N.fbm(u * 0.02, v * 0.02))
          t += eyes * 0.7 * figS
        } else if (fig === 'ribbon') {
          const rp = (u + N.n(u * 0.01, v * 0.004) * 8) / (9 * fScale)
          const rib = Math.sin(rp * Math.PI * 2)
          bright *= 1 + rib * 0.12 * figS
          t += rib * 0.07 * figS
        } else if (fig === 'stripe') {
          const sn = N2.fbm(u * 0.035 / fScale, v * 0.0025, 3)
          const st = ss(0.05, 0.35, sn)
          t += st * 0.9 * figS
        }
      }
      if (look.pores > 0) {
        const pn = N2.n(u * 1.6, v * 0.16)
        const pore = ss(1 - look.pores * 0.42, 1 - look.pores * 0.3, pn)
        t += pore * look.poreContrast * (0.6 + 0.4 * (1 - fr))
      }
      if (t < 0) t = 0
      else if (t > 1) t = 1
      const hv = 1 + N.fbm(u * 0.006 + 77, v * 0.003, 2) * look.hueVariation
      const i = (py * W + px) * 4
      data[i] = (L[0] + (D[0] - L[0]) * t) * bright * hv
      data[i + 1] = (L[1] + (D[1] - L[1]) * t) * bright
      data[i + 2] = (L[2] + (D[2] - L[2]) * t) * bright * (2 - hv)
      data[i + 3] = 255
    }
  }
  return { width: W, height: H, data }
}
