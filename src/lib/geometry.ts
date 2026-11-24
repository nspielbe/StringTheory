import type { ShapePoint, Vec2 } from '../types'

export const IN = 25.4

export function fretFromBridge(scale: number, n: number): number {
  return scale / Math.pow(2, n / 12)
}

/** Distance from the bridge saddle line (y) of fret n; nut is fret 0. */
export function fretY(scale: number, n: number): number {
  return fretFromBridge(scale, n)
}

function catmull(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number, alpha = 0.5): Vec2 {
  // Centripetal Catmull–Rom (no cusps / self-intersections on uneven spacing).
  const d = (a: Vec2, b: Vec2) => Math.max(1e-4, Math.pow(Math.hypot(b.x - a.x, b.y - a.y), alpha))
  const t0 = 0
  const t1 = t0 + d(p0, p1)
  const t2 = t1 + d(p1, p2)
  const t3 = t2 + d(p2, p3)
  const tt = t1 + (t2 - t1) * t
  const lerp = (a: Vec2, b: Vec2, ta: number, tb: number): Vec2 => {
    const k = (tt - ta) / (tb - ta)
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
  }
  const a1 = lerp(p0, p1, t0, t1)
  const a2 = lerp(p1, p2, t1, t2)
  const a3 = lerp(p2, p3, t2, t3)
  const b1 = lerp(a1, a2, t0, t2)
  const b2 = lerp(a2, a3, t1, t3)
  return lerp(b1, b2, t1, t2)
}

/**
 * Sample a closed outline. Smooth points get a Catmull–Rom curve; corner
 * points break the curve so straight/angular edges stay crisp.
 */
export function sampleOutline(points: ShapePoint[], step = 2): Vec2[] {
  const n = points.length
  if (n < 3) return points.map((p) => ({ x: p.x, y: p.y }))
  const out: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    // At corners, use the corner point itself as the tangent neighbour (makes the segment straight-ish there).
    const p0 = p1.corner ? p1 : points[(i - 1 + n) % n]
    const p3 = p2.corner ? p2 : points[(i + 2) % n]
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    const segs = Math.max(2, Math.ceil(len / step))
    for (let s = 0; s < segs; s++) {
      const t = s / segs
      if (p1.corner && p2.corner) out.push({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t })
      else out.push(catmull(p0, p1, p2, p3, t))
    }
  }
  return dedupe(out)
}

function dedupe(pts: Vec2[]): Vec2[] {
  const out: Vec2[] = []
  for (const p of pts) {
    const q = out[out.length - 1]
    if (!q || Math.hypot(p.x - q.x, p.y - q.y) > 0.05) out.push(p)
  }
  const f = out[0]
  const l = out[out.length - 1]
  if (out.length > 2 && Math.hypot(f.x - l.x, f.y - l.y) < 0.05) out.pop()
  return out
}

export function signedArea(pts: Vec2[]): number {
  let a = 0
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % n]
    a += p.x * q.y - q.x * p.y
  }
  return a / 2
}

export function ensureCCW(pts: Vec2[]): Vec2[] {
  return signedArea(pts) < 0 ? [...pts].reverse() : pts
}

export function bounds(pts: Vec2[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

export function perimeter(pts: Vec2[]): number {
  let l = 0
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % n]
    l += Math.hypot(q.x - p.x, q.y - p.y)
  }
  return l
}

export function pointInPolygon(x: number, y: number, pts: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]
    const b = pts[j]
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

export function distToSegment(px: number, py: number, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l2 = dx * dx + dy * dy
  let t = l2 > 0 ? ((px - a.x) * dx + (py - a.y) * dy) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t))
}

/** Distance from a point to a closed polygon's boundary. */
export function distToPolygon(px: number, py: number, pts: Vec2[]): number {
  let d = Infinity
  for (let i = 0, n = pts.length; i < n; i++) {
    const v = distToSegment(px, py, pts[i], pts[(i + 1) % n])
    if (v < d) d = v
  }
  return d
}

/** Spatial hash for fast distance-to-outline queries on dense meshes. */
export class SegmentGrid {
  private cells = new Map<string, number[]>()
  constructor(private pts: Vec2[], private cell = 12) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      const x0 = Math.floor(Math.min(a.x, b.x) / cell)
      const x1 = Math.floor(Math.max(a.x, b.x) / cell)
      const y0 = Math.floor(Math.min(a.y, b.y) / cell)
      const y1 = Math.floor(Math.max(a.y, b.y) / cell)
      for (let cx = x0; cx <= x1; cx++)
        for (let cy = y0; cy <= y1; cy++) {
          const k = cx + ',' + cy
          let arr = this.cells.get(k)
          if (!arr) this.cells.set(k, (arr = []))
          arr.push(i)
        }
    }
  }
  /** Distance to the nearest segment, searching outward up to maxD. */
  dist(px: number, py: number, maxD = 80): number {
    const c = this.cell
    const cx = Math.floor(px / c)
    const cy = Math.floor(py / c)
    let best = Infinity
    const rings = Math.ceil(maxD / c) + 1
    for (let r = 0; r <= rings; r++) {
      for (let ix = cx - r; ix <= cx + r; ix++)
        for (let iy = cy - r; iy <= cy + r; iy++) {
          if (Math.max(Math.abs(ix - cx), Math.abs(iy - cy)) !== r) continue
          const arr = this.cells.get(ix + ',' + iy)
          if (!arr) continue
          for (const i of arr) {
            const v = distToSegment(px, py, this.pts[i], this.pts[(i + 1) % this.pts.length])
            if (v < best) best = v
          }
        }
      if (best <= r * c) break
    }
    return best === Infinity ? maxD : best
  }
}

/** Offset (inset for positive d on a CCW polygon) using mitred vertex normals. */
export function offsetPolygon(pts: Vec2[], d: number, maxMiter = 2.5): Vec2[] {
  const n = pts.length
  const out: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    const a = pts[(i - 1 + n) % n]
    const b = pts[(i + 1) % n]
    const n1 = leftNormal(a, p)
    const n2 = leftNormal(p, b)
    let nx = n1.x + n2.x
    let ny = n1.y + n2.y
    const l = Math.hypot(nx, ny) || 1
    nx /= l
    ny /= l
    const cos = nx * n1.x + ny * n1.y
    const m = Math.min(maxMiter, 1 / Math.max(0.2, cos))
    out.push({ x: p.x + nx * d * m, y: p.y + ny * d * m })
  }
  return out
}

/** Inward normal for a CCW polygon edge a→b. */
export function leftNormal(a: Vec2, b: Vec2): Vec2 {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l = Math.hypot(dx, dy) || 1
  return { x: -dy / l, y: dx / l }
}

export function polygonArea(pts: Vec2[]): number {
  return Math.abs(signedArea(pts))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v
}

export function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Points evenly spread along a line segment. */
export function spread(a: Vec2, b: Vec2, n: number): Vec2[] {
  if (n <= 1) return [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }]
  return Array.from({ length: n }, (_, i) => ({ x: lerp(a.x, b.x, i / (n - 1)), y: lerp(a.y, b.y, i / (n - 1)) }))
}

/** Build an SVG path string for a sampled outline. */
export function toSvgPath(pts: Vec2[], flipY = true): string {
  if (!pts.length) return ''
  const f = (p: Vec2) => `${p.x.toFixed(2)},${(flipY ? -p.y : p.y).toFixed(2)}`
  return 'M' + pts.map(f).join('L') + 'Z'
}

export function uid(prefix = 'id'): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
