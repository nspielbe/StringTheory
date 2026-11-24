import * as THREE from 'three'
import type { Design, Vec2 } from '../types'
import { SegmentGrid, offsetPolygon, smoothstep } from '../lib/geometry'
import { carveAmount, fretboardEndY, neckWidthAt, resolveBody } from '../lib/layout'

// Body = top face (cap + rounded rim) + back face + side wall.
// The cap is a grid triangulation clipped to the inset outline; the outline is
// augmented with every grid-line crossing so cap, rim and wall share vertices
// exactly (no cracks or shading seams).

interface ParamPt extends Vec2 {
  t: number
}

const GRID = 3.5

function augment(poly: ParamPt[], h: number): ParamPt[] {
  const out: ParamPt[] = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    out.push(a)
    const ts: number[] = []
    const dx = b.x - a.x
    const dy = b.y - a.y
    if (Math.abs(dx) > 1e-9) {
      const lo = Math.min(a.x, b.x)
      const hi = Math.max(a.x, b.x)
      for (let k = Math.ceil(lo / h); k * h < hi; k++) {
        const t = (k * h - a.x) / dx
        if (t > 1e-6 && t < 1 - 1e-6) ts.push(t)
      }
    }
    if (Math.abs(dy) > 1e-9) {
      const lo = Math.min(a.y, b.y)
      const hi = Math.max(a.y, b.y)
      for (let k = Math.ceil(lo / h); k * h < hi; k++) {
        const t = (k * h - a.y) / dy
        if (t > 1e-6 && t < 1 - 1e-6) ts.push(t)
      }
    }
    ts.sort((p, q) => p - q)
    const tb = b.t < a.t ? b.t + n : b.t
    for (const t of ts) {
      const x = a.x + dx * t
      const y = a.y + dy * t
      // snap exactly onto the grid line we crossed
      const sx = Math.abs(x / h - Math.round(x / h)) < 1e-6 ? Math.round(x / h) * h : x
      const sy = Math.abs(y / h - Math.round(y / h)) < 1e-6 ? Math.round(y / h) * h : y
      out.push({ x: sx, y: sy, t: (a.t + (tb - a.t) * t) % n })
    }
  }
  return out
}

function clipToCell(poly: Vec2[], x0: number, y0: number, x1: number, y1: number): Vec2[] {
  const eps = 1e-7
  type Edge = { inside: (p: Vec2) => boolean; cut: (a: Vec2, b: Vec2) => Vec2 }
  const edges: Edge[] = [
    { inside: (p) => p.x >= x0 - eps, cut: (a, b) => ({ x: x0, y: a.y + ((b.y - a.y) * (x0 - a.x)) / (b.x - a.x) }) },
    { inside: (p) => p.x <= x1 + eps, cut: (a, b) => ({ x: x1, y: a.y + ((b.y - a.y) * (x1 - a.x)) / (b.x - a.x) }) },
    { inside: (p) => p.y >= y0 - eps, cut: (a, b) => ({ x: a.x + ((b.x - a.x) * (y0 - a.y)) / (b.y - a.y), y: y0 }) },
    { inside: (p) => p.y <= y1 + eps, cut: (a, b) => ({ x: a.x + ((b.x - a.x) * (y1 - a.y)) / (b.y - a.y), y: y1 }) },
  ]
  let out = poly
  for (const e of edges) {
    const inp = out
    out = []
    if (!inp.length) break
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i]
      const prev = inp[(i - 1 + inp.length) % inp.length]
      const ci = e.inside(cur)
      const pi = e.inside(prev)
      if (ci) {
        if (!pi) out.push(e.cut(prev, cur))
        out.push(cur)
      } else if (pi) out.push(e.cut(prev, cur))
    }
  }
  const res: Vec2[] = []
  for (const p of out) {
    const q = res[res.length - 1]
    if (!q || Math.abs(q.x - p.x) > 1e-6 || Math.abs(q.y - p.y) > 1e-6) res.push(p)
  }
  if (res.length > 1) {
    const f = res[0]
    const l = res[res.length - 1]
    if (Math.abs(f.x - l.x) < 1e-6 && Math.abs(f.y - l.y) < 1e-6) res.pop()
  }
  return res
}

class VertexPool {
  pos: number[] = []
  xy: Vec2[] = []
  map = new Map<string, number>()
  key(x: number, y: number) {
    return Math.round(x * 1e4) + ',' + Math.round(y * 1e4)
  }
  get(x: number, y: number): number {
    const k = this.key(x, y)
    let i = this.map.get(k)
    if (i === undefined) {
      i = this.xy.length
      this.xy.push({ x, y })
      this.map.set(k, i)
    }
    return i
  }
}

/** Grid-clipped triangulation of a polygon whose vertices include all grid crossings. */
function triangulateCap(poly: Vec2[], h: number, pool: VertexPool, tris: number[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of poly) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  const i0 = Math.floor(minX / h), i1 = Math.ceil(maxX / h)
  const j0 = Math.floor(minY / h), j1 = Math.ceil(maxY / h)
  const boundary = new Set<string>()
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    boundary.add(Math.floor(mx / h) + ',' + Math.floor(my / h))
  }
  for (let j = j0; j < j1; j++) {
    const cy = (j + 0.5) * h
    // crossings of the scanline through cell centres
    const xs: number[] = []
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      if (a.y > cy !== b.y > cy) xs.push(a.x + ((cy - a.y) * (b.x - a.x)) / (b.y - a.y))
    }
    xs.sort((p, q) => p - q)
    for (let i = i0; i < i1; i++) {
      const x0 = i * h, x1 = x0 + h, y0 = j * h, y1 = y0 + h
      if (boundary.has(i + ',' + j)) {
        const piece = clipToCell(poly, x0, y0, x1, y1)
        if (piece.length < 3) continue
        const contour = piece.map((p) => new THREE.Vector2(p.x, p.y))
        if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse()
        const faces = THREE.ShapeUtils.triangulateShape(contour, [])
        const ids = contour.map((p) => pool.get(p.x, p.y))
        for (const f of faces) {
          const a = contour[f[0]], b = contour[f[1]], c = contour[f[2]]
          const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
          if (Math.abs(area) < 1e-8) continue
          if (area > 0) tris.push(ids[f[0]], ids[f[1]], ids[f[2]])
          else tris.push(ids[f[0]], ids[f[2]], ids[f[1]])
        }
      } else {
        const cx = (i + 0.5) * h
        let c = 0
        for (const x of xs) if (x < cx) c++
        if (c % 2 === 1) {
          const a = pool.get(x0, y0), b = pool.get(x1, y0), cc = pool.get(x1, y1), dd = pool.get(x0, y1)
          tris.push(a, b, cc, a, cc, dd)
        }
      }
    }
  }
}

export interface BodyGeometry {
  top: THREE.BufferGeometry
  back: THREE.BufferGeometry
  side: THREE.BufferGeometry
  /** z of the top surface at (x, y). */
  topZ: (x: number, y: number) => number
  backZ: (x: number, y: number) => number
  volumeMm3: number
}

export function buildBody(d: Design): BodyGeometry {
  const body = resolveBody(d)
  const O = body.outline
  const N = O.length
  const T = d.body.thickness
  const rt = Math.max(0.6, Math.min(d.body.edgeRadius, T * 0.4))
  const rb = Math.max(0.6, Math.min(d.body.backRadius, T * 0.4))
  const sg = new SegmentGrid(O, 12)
  const uvOf = (x: number, y: number): [number, number] => [x, y]
  const fbEnd = fretboardEndY(d)
  const carved = d.body.top.enabled && d.body.top.carved

  const armW = (x: number, y: number) => (d.body.armContour ? smoothstep(-110, -45, y) * (1 - smoothstep(70, 140, y)) * smoothstep(-20, -80, x) : 0)
  const bellyW = (x: number, y: number) => (d.body.bellyCut ? smoothstep(10, 90, y) * (1 - smoothstep(250, 320, y)) * smoothstep(-15, -75, x) : 0)
  const chamfer = d.body.chamfer
  const chamferW = chamfer * 2.6

  const deltaTop = (x: number, y: number, dist: number) => {
    let z = 0
    if (carved) {
      let c = carveAmount(d, dist)
      // keep a flat landing under the fretboard extension
      const half = neckWidthAt(d, y) / 2 + 7
      const under = (1 - smoothstep(half, half + 10, Math.abs(x))) * smoothstep(fbEnd - 20, fbEnd - 4, y)
      c *= 1 - under
      z += c
    }
    if (chamfer > 0) z -= chamfer * Math.max(0, 1 - dist / chamferW)
    const aw = armW(x, y)
    if (aw > 0) z -= 11 * aw * Math.pow(Math.max(0, 1 - dist / 62), 1.5)
    return z
  }
  const deltaBack = (x: number, y: number, dist: number) => {
    let z = 0
    if (chamfer > 0) z += chamfer * Math.max(0, 1 - dist / chamferW)
    const bw = bellyW(x, y)
    if (bw > 0) z += 13 * bw * Math.pow(Math.max(0, 1 - dist / 80), 1.6)
    return z
  }

  const outerTop: { x: number; y: number; z: number; t: number }[] = []
  const outerBack: { x: number; y: number; z: number; t: number }[] = []
  let volume = 0

  function face(isTop: boolean): THREE.BufferGeometry {
    const r = isTop ? rt : rb
    const base = O.map((p, i) => ({ ...p, t: i }))
    const inset = offsetPolygon(O, r).map((p, i) => ({ ...p, t: i }))
    const ring = augment(inset, GRID)
    const pool = new VertexPool()
    const tris: number[] = []
    triangulateCap(ring, GRID, pool, tris)
    const capCount = pool.xy.length
    // rim
    const K = r > 1.2 ? 6 : 2
    const ringIds = ring.map((p) => pool.get(p.x, p.y))
    const rimPos: { x: number; y: number; dist: number; k: number }[] = []
    const rimIndex: number[][] = []
    const n = ring.length
    for (let i = 0; i < n; i++) {
      const p = ring[i]
      const a = ring[(i - 1 + n) % n]
      const c = ring[(i + 1) % n]
      let nx = c.y - a.y
      let ny = -(c.x - a.x)
      const l = Math.hypot(nx, ny) || 1
      nx /= l
      ny /= l
      // aim the outer ring at the true outline point with the same parameter
      const ti = Math.floor(p.t) % N
      const fr = p.t - Math.floor(p.t)
      const o1 = base[ti]
      const o2 = base[(ti + 1) % N]
      const ox = o1.x + (o2.x - o1.x) * fr
      const oy = o1.y + (o2.y - o1.y) * fr
      const ids = [ringIds[i]]
      for (let k = 1; k <= K; k++) {
        const phi = (k / K) * (Math.PI / 2)
        const s = Math.sin(phi)
        // blend from normal-offset toward the outline point so the wall sits on the outline
        const wx = p.x + nx * r * s
        const wy = p.y + ny * r * s
        const bl = k / K
        const x = wx + (ox - wx) * bl * bl
        const y = wy + (oy - wy) * bl * bl
        rimPos.push({ x, y, dist: r * (1 - s), k })
        ids.push(capCount + rimPos.length - 1)
      }
      rimIndex.push(ids)
    }
    const total = capCount + rimPos.length
    const pos = new Float32Array(total * 3)
    const uv = new Float32Array(total * 2)
    for (let i = 0; i < capCount; i++) {
      const p = pool.xy[i]
      const dist = sg.dist(p.x, p.y, 90)
      const z = isTop ? T + deltaTop(p.x, p.y, dist) : deltaBack(p.x, p.y, dist)
      pos.set([p.x, p.y, z], i * 3)
      uv.set(uvOf(p.x, p.y), i * 2)
    }
    for (let i = 0; i < rimPos.length; i++) {
      const p = rimPos[i]
      const phi = (p.k / K) * (Math.PI / 2)
      const z = isTop ? T - r + r * Math.cos(phi) + deltaTop(p.x, p.y, p.dist) : r - r * Math.cos(phi) + deltaBack(p.x, p.y, p.dist)
      pos.set([p.x, p.y, z], (capCount + i) * 3)
      uv.set(uvOf(p.x, p.y), (capCount + i) * 2)
    }
    for (let i = 0; i < n; i++) {
      const A = rimIndex[i]
      const B = rimIndex[(i + 1) % n]
      for (let k = 0; k < K; k++) tris.push(A[k], A[k + 1], B[k + 1], A[k], B[k + 1], B[k])
      const last = A[K]
      const outer = { x: pos[last * 3], y: pos[last * 3 + 1], z: pos[last * 3 + 2], t: ring[i].t }
      if (isTop) outerTop.push(outer)
      else outerBack.push(outer)
    }
    // cap triangles were CCW seen from +z; rim winding: inner→outer then along ring (CCW ring) gives outward-up faces
    let idx = tris
    if (!isTop) {
      idx = []
      for (let i = 0; i < tris.length; i += 3) idx.push(tris[i], tris[i + 2], tris[i + 1])
    } else {
      // rough volume: area * thickness via cap triangles
      for (let i = 0; i < tris.length; i += 3) {
        const ia = tris[i] * 3, ib = tris[i + 1] * 3, ic = tris[i + 2] * 3
        if (tris[i] >= capCount) continue
        const ar = ((pos[ib] - pos[ia]) * (pos[ic + 1] - pos[ia + 1]) - (pos[ic] - pos[ia]) * (pos[ib + 1] - pos[ia + 1])) / 2
        volume += Math.abs(ar) * ((pos[ia + 2] + pos[ib + 2] + pos[ic + 2]) / 3)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }

  const top = face(true)
  const back = face(false)

  // Side wall: zip the two outer rings together by outline parameter.
  const side = zipWall(outerTop, outerBack, N, T)

  const topZ = (x: number, y: number) => T + deltaTop(x, y, sg.dist(x, y, 90))
  const backZ = (x: number, y: number) => deltaBack(x, y, sg.dist(x, y, 90))
  return { top, back, side, topZ, backZ, volumeMm3: volume }
}

function zipWall(A: { x: number; y: number; z: number; t: number }[], B: { x: number; y: number; z: number; t: number }[], N: number, T: number) {
  const rot = <P extends { t: number }>(arr: P[]) => {
    let m = 0
    for (let i = 1; i < arr.length; i++) if (arr[i].t < arr[m].t) m = i
    return [...arr.slice(m), ...arr.slice(0, m)]
  }
  const a = rot(A)
  const b = rot(B)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const push = (p: { x: number; y: number; z: number; t: number }, zMin: number) => {
    pos.push(p.x, p.y, Math.max(p.z, zMin))
    uv.push(p.t / N, Math.max(p.z, zMin) / T)
    return pos.length / 3 - 1
  }
  const ia = a.map((p) => push(p, 0))
  const ib = b.map((p) => push(p, -1e9))
  // duplicate first vertices at t = N for a clean UV seam
  const ia0 = push({ ...a[0], t: N }, 0)
  const ib0 = push({ ...b[0], t: N }, -1e9)
  const ta = [...a.map((p) => p.t), N]
  const tb = [...b.map((p) => p.t), N]
  const IA = [...ia, ia0]
  const IB = [...ib, ib0]
  let i = 0
  let j = 0
  while (i < IA.length - 1 || j < IB.length - 1) {
    const advA = j >= IB.length - 1 || (i < IA.length - 1 && ta[i + 1] <= tb[j + 1])
    if (advA) {
      idx.push(IA[i], IB[j], IA[i + 1])
      i++
    } else {
      idx.push(IA[i], IB[j], IB[j + 1])
      j++
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}
