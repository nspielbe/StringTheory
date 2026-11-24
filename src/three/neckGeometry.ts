import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Design } from '../types'
import { fretY, smoothstep } from '../lib/geometry'
import { fretboardEndY, neckWidthAt, type NeckFrame } from '../lib/layout'

const PROFILE_N: Record<string, number> = { C: 2.3, D: 2.9, U: 3.6, V: 1.55, thinD: 2.9 }

export function radiusAt(d: Design, y: number) {
  const L = d.scale
  const yEnd = fretboardEndY(d)
  const t = Math.max(0, Math.min(1, (L - y) / (L - yEnd)))
  return (d.neck.radius + (d.neck.radiusEnd - d.neck.radius) * t) * 25.4
}

/** Fretboard crown height at (x, y). */
export function fbSurface(d: Design, f: NeckFrame, x: number, y: number) {
  const R = radiusAt(d, y)
  return f.fbTop(y) - (R - Math.sqrt(Math.max(0, R * R - x * x)))
}

export function neckThickness(d: Design, y: number) {
  const L = d.scale
  const y1 = fretY(L, 1)
  const y12 = fretY(L, 12)
  const t = (y1 - y) / (y1 - y12)
  const base = d.neck.thickness1 + (d.neck.thickness12 - d.neck.thickness1) * t
  return d.neck.profile === 'thinD' ? base - 2 : base
}

/** Back-of-neck loft from the heel to just past the nut. */
export function buildNeckShaft(d: Design, f: NeckFrame, backZ: (x: number, y: number) => number): THREE.BufferGeometry {
  const L = d.scale
  const yEnd = fretboardEndY(d)
  const pocket = f.pocketY
  const setNeck = d.neck.construction !== 'bolt-on'
  const yStart = Math.min(yEnd + 2, pocket - 20)
  const yStop = L + 14
  const headT = d.headstock.thickness
  const n = PROFILE_N[d.neck.profile] ?? 2.3
  const M = 28
  const rows: number[] = []
  for (let y = yStart; y < yStop; y += 6) rows.push(y)
  rows.push(yStop)
  const pos: number[] = []
  const uv: number[] = []
  for (const y of rows) {
    const w = neckWidthAt(d, Math.min(y, L)) / 2
    const top = f.neckTop(Math.min(y, L))
    let t = neckThickness(d, Math.min(y, L))
    if (y > L) t = t + (headT + 1 - t) * smoothstep(L, L + 14, y)
    if (setNeck) {
      const heelDepth = top - (backZ(0, pocket - 30) + 4)
      const k = smoothstep(pocket + (d.neck.construction === 'neck-through' ? 90 : 55), pocket - 5, y)
      t = Math.max(t, t + (heelDepth - t) * k)
    }
    for (let i = 0; i <= M; i++) {
      const th = (i / M) * Math.PI
      const c = Math.cos(th)
      const s = Math.sin(th)
      const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w
      const z = top - Math.pow(s, 2 / n) * t
      pos.push(x, y, z)
      uv.push(x / 90 + 0.5, y / 1000)
    }
  }
  const idx: number[] = []
  const R = M + 1
  for (let r = 0; r < rows.length - 1; r++)
    for (let i = 0; i < M; i++) {
      const a = r * R + i
      const b = a + 1
      const c = a + R
      const e = c + 1
      idx.push(a, b, c, b, e, c)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export interface FretboardGeo {
  top: THREE.BufferGeometry
  sides: THREE.BufferGeometry
  frets: THREE.BufferGeometry
}

export function buildFretboard(d: Design, f: NeckFrame): FretboardGeo {
  const L = d.scale
  const yEnd = fretboardEndY(d)
  const X = 18
  const ys: number[] = []
  for (let y = yEnd; y < L; y += 5) ys.push(y)
  ys.push(L)
  const pos: number[] = []
  const uv: number[] = []
  for (const y of ys) {
    const w = neckWidthAt(d, y) / 2
    for (let i = 0; i <= X; i++) {
      const x = -w + (2 * w * i) / X
      pos.push(x, y, fbSurface(d, f, x, y))
      uv.push(x, y)
    }
  }
  const idx: number[] = []
  for (let r = 0; r < ys.length - 1; r++)
    for (let i = 0; i < X; i++) {
      const a = r * (X + 1) + i
      idx.push(a, a + 1, a + X + 1, a + 1, a + X + 2, a + X + 1)
    }
  const top = new THREE.BufferGeometry()
  top.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  top.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  top.setIndex(idx)
  top.computeVertexNormals()

  // sides + end
  const sp2: number[] = []
  const si: number[] = []
  const quad = (a: number[], b: number[], c: number[], e: number[]) => {
    const o = sp2.length / 3
    sp2.push(...a, ...b, ...c, ...e)
    si.push(o, o + 1, o + 2, o, o + 2, o + 3)
  }
  for (let r = 0; r < ys.length - 1; r++) {
    const y0 = ys[r], y1 = ys[r + 1]
    for (const side of [-1, 1]) {
      const x0 = (side * neckWidthAt(d, y0)) / 2
      const x1 = (side * neckWidthAt(d, y1)) / 2
      const a = [x0, y0, f.neckTop(y0)]
      const b = [x1, y1, f.neckTop(y1)]
      const c = [x1, y1, fbSurface(d, f, x1, y1)]
      const e = [x0, y0, fbSurface(d, f, x0, y0)]
      if (side > 0) quad(a, b, c, e)
      else quad(b, a, e, c)
    }
  }
  const we = neckWidthAt(d, yEnd) / 2
  for (let i = 0; i < 8; i++) {
    const xa = -we + (2 * we * i) / 8
    const xb = -we + (2 * we * (i + 1)) / 8
    quad([xa, yEnd, f.neckTop(yEnd)], [xb, yEnd, f.neckTop(yEnd)], [xb, yEnd, fbSurface(d, f, xb, yEnd)], [xa, yEnd, fbSurface(d, f, xa, yEnd)])
  }
  const sides = new THREE.BufferGeometry()
  sides.setAttribute('position', new THREE.Float32BufferAttribute(sp2, 3))
  sides.setIndex(si)
  sides.computeVertexNormals()

  // frets
  const crown = { narrow: 0.85, medium: 1.05, jumbo: 1.4, stainless: 1.2, gold: 1.2 }[d.neck.fretWire]
  const parts: THREE.BufferGeometry[] = []
  for (let k = 1; k <= d.frets; k++) {
    const y = fretY(L, k)
    const w = neckWidthAt(d, y) / 2 - 0.3
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 10; i++) {
      const x = -w + (2 * w * i) / 10
      pts.push(new THREE.Vector3(x, y, fbSurface(d, f, x, y) - crown * 0.15))
    }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, crown, 6, false))
  }
  const frets = parts.length ? mergeGeometries(parts)! : new THREE.BufferGeometry()
  parts.forEach((p) => p.dispose())
  return { top, sides, frets }
}

export function buildHeadstock(outline: { x: number; y: number }[], thickness: number) {
  const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, p.y)))
  const bevel = 1.2
  const body = new THREE.ExtrudeGeometry(shape, { depth: thickness - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 2, curveSegments: 1 })
  body.translate(0, 0, -(thickness - bevel))
  // remap UVs to the neck wood planar mapping (mm -> 1/90, 1/1000)
  const uv = body.getAttribute('uv') as THREE.BufferAttribute
  const p = body.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 90 + 0.5, (p.getY(i) + 700) / 1000)
  const face = new THREE.ShapeGeometry(shape, 1)
  face.translate(0, 0, 0.25)
  return { body, face }
}
