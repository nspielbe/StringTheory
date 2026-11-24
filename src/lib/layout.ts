import type { BodyShapeData, Design, HeadstockShapeData, PickupSlot, PickupType, ShapePoint, Vec2 } from '../types'
import { bodyTemplate, PICKGUARD_TEMPLATES } from '../data/bodyShapes'
import { headstockTemplate } from '../data/headstockShapes'
import { bounds, ensureCCW, fretY, sampleOutline, smoothstep, spread } from './geometry'

export const FRETBOARD_THICKNESS = 6.35
export const FRETBOARD_OVERHANG = 6

export function nutWidth(d: Design) {
  return d.neck.nutWidth
}

/** Neck width at body-space y (linear taper from nut to last fret). */
export function neckWidthAt(d: Design, y: number): number {
  const yLast = fretY(d.scale, d.frets)
  const t = (d.scale - y) / (d.scale - yLast)
  return d.neck.nutWidth + d.neck.taper * t
}

export function fretboardEndY(d: Design) {
  return fretY(d.scale, d.frets) - FRETBOARD_OVERHANG
}

export function bodyShape(d: Design): BodyShapeData {
  return d.body.custom ?? bodyTemplate(d.body.shapeId).shape
}

function snapPocket(points: ShapePoint[], halfW: (p: ShapePoint) => number): ShapePoint[] {
  return points.map((p) => (p.pocket ? { ...p, x: (p.pocket === 'L' ? -1 : 1) * halfW(p) } : p))
}

export interface ResolvedBody {
  points: ShapePoint[]
  outline: Vec2[]
  bounds: ReturnType<typeof bounds>
  neckPocketY: number
  shape: BodyShapeData
}

const bodyCache = new WeakMap<object, ResolvedBody>()

export function resolveBody(d: Design): ResolvedBody {
  const shape = bodyShape(d)
  const key = shape as object
  const cached = bodyCache.get(key)
  const sig = `${d.neck.nutWidth}|${d.neck.taper}|${d.scale}|${d.frets}`
  if (cached && (cached as ResolvedBody & { sig?: string }).sig === sig) return cached
  const points = snapPocket(shape.points, (p) => neckWidthAt(d, p.y) / 2 + 0.6)
  const outline = ensureCCW(sampleOutline(points, 2))
  const r: ResolvedBody & { sig?: string } = { points, outline, bounds: bounds(outline), neckPocketY: shape.neckPocketY, shape, sig }
  bodyCache.set(key, r)
  return r
}

export function headstockShape(d: Design): HeadstockShapeData {
  return d.headstock.custom ?? headstockTemplate(d.headstock.shapeId).shape
}

export interface ResolvedHeadstock {
  points: ShapePoint[]
  outline: Vec2[]
  bounds: ReturnType<typeof bounds>
  /** Tuner posts in headstock space, indexed by string (0 = lowest). */
  posts: Vec2[]
  /** Which side each tuner button sticks out on (-1 bass / +1 treble). */
  buttonSide: number[]
  mode: 'inline' | 'split' | 'none'
}

export function resolveHeadstock(d: Design): ResolvedHeadstock {
  const shape = headstockShape(d)
  const mirror = d.headstock.reversed ? -1 : 1
  let points = snapPocket(shape.points, () => d.neck.nutWidth / 2 + 0.6)
  if (mirror < 0) points = points.map((p) => ({ ...p, x: -p.x, pocket: p.pocket === 'L' ? 'R' : p.pocket === 'R' ? 'L' : undefined }))
  const outline = ensureCCW(sampleOutline(points, 1.5))
  const n = d.strings
  const t = shape.tuners
  const m = (v: Vec2): Vec2 => ({ x: v.x * mirror, y: v.y })
  let posts: Vec2[] = []
  let buttonSide: number[] = []
  if (t.mode === 'inline') {
    const line = spread(m(t.a[0]), m(t.a[1]), n)
    // Normal: lowest string nearest the nut. Reversed: highest string nearest the nut.
    posts = mirror > 0 ? line : [...line].reverse()
    const side = (t.side === 'R' ? 1 : -1) * mirror
    buttonSide = posts.map(() => side)
  } else if (t.mode === 'split') {
    const bassN = Math.ceil(n / 2)
    const trebN = n - bassN
    const bass = spread(m(t.a[0]), m(t.a[1]), bassN)
    const treb = spread(m(t.b ? t.b[0] : { x: -t.a[0].x, y: t.a[0].y }), m(t.b ? t.b[1] : { x: -t.a[1].x, y: t.a[1].y }), trebN)
    posts = [...bass, ...[...treb].reverse()]
    buttonSide = [...bass.map(() => -mirror), ...treb.map(() => mirror)]
  }
  return { points, outline, bounds: bounds(outline), posts, buttonSide, mode: t.mode }
}

// ------------------------------------------------------------------ pickups

export const PICKUP_DIMS: Record<PickupType, { w: number; h: number; ring?: [number, number] }> = {
  humbucker: { w: 70, h: 38, ring: [92, 48] },
  single: { w: 83, h: 18 },
  'single-hb': { w: 83, h: 18 },
  p90: { w: 86, h: 35 },
  'tele-bridge': { w: 72, h: 22 },
}

export interface PlacedPickup {
  slot: PickupSlot
  index: number
  x: number
  y: number
  w: number
  h: number
  rot: number
}

export function placePickups(d: Design): PlacedPickup[] {
  const fbEnd = fretboardEndY(d)
  const wide = d.strings === 7 ? 1.12 : 1
  return d.pickups.map((slot, index) => {
    const dim = PICKUP_DIMS[slot.type]
    const half = dim.h / 2
    let y: number
    if (slot.position === 'bridge') y = slot.type === 'tele-bridge' ? 32 : slot.type === 'humbucker' ? 44 : 40
    else if (slot.position === 'neck') y = Math.min(fbEnd - half - 7, 166)
    else {
      const neckY = Math.min(fbEnd - 24 - 7, 166)
      y = (neckY + 42) / 2
    }
    y += slot.offset
    return { slot, index, x: 0, y, w: dim.w * wide, h: dim.h, rot: (slot.slant * Math.PI) / 180 }
  })
}

// ------------------------------------------------------------------ strings

const GAUGES_6 = [0.046, 0.036, 0.026, 0.017, 0.013, 0.01]
const GAUGES_7 = [0.059, 0.046, 0.036, 0.026, 0.017, 0.013, 0.01]

export interface StringLine {
  gauge: number
  bridgeX: number
  nutX: number
  wound: boolean
}

export function bridgeSpacing(d: Design) {
  switch (d.hardware.bridge) {
    case 'tom': return 10.4
    case 'tele':
    case 'vintage-trem': return 10.8
    default: return 10.5
  }
}

export function stringLines(d: Design): StringLine[] {
  const n = d.strings
  const g = n === 7 ? GAUGES_7 : GAUGES_6
  const bs = bridgeSpacing(d)
  const nutSpan = d.neck.nutWidth - 2 * 3.3
  return g.map((gauge, i) => ({
    gauge: gauge * 25.4,
    bridgeX: (i - (n - 1) / 2) * bs,
    nutX: -nutSpan / 2 + (nutSpan * i) / (n - 1),
    wound: gauge >= 0.02,
  }))
}

// ------------------------------------------------------------------ heights

export interface NeckFrame {
  /** Neck top surface (under the fretboard) z at body-space y. */
  neckTop: (y: number) => number
  /** Fretboard crown (centre) z at y. */
  fbTop: (y: number) => number
  /** String z at y (centre string). */
  stringZ: (y: number) => number
  bodyTopAtBridge: number
  saddleZ: number
  pocketY: number
  angle: number
}

export function carveAmount(d: Design, dist: number): number {
  const t = d.body.top
  if (!t.enabled || !t.carved) return 0
  const w = Math.max(5, t.carveWidth)
  const s = smoothstep(0, w, dist)
  const recurve = t.recurve * Math.exp(-Math.pow((dist - w * 0.22) / (w * 0.16), 2)) * 0.35
  return t.carveHeight * Math.max(0, s - recurve)
}

export function neckFrame(d: Design, bodyTopAt: (x: number, y: number) => number): NeckFrame {
  const body = resolveBody(d)
  const pocketY = body.neckPocketY
  const T = d.body.thickness
  const angle = (d.neck.angle * Math.PI) / 180
  const lift = d.neck.construction === 'bolt-on' ? 0.8 : 1.5
  const zP = T + lift + (d.body.top.enabled && !d.body.top.carved ? 0 : 0)
  const neckTop = (y: number) => zP - (y - pocketY) * Math.tan(angle)
  const fbTop = (y: number) => neckTop(y) + FRETBOARD_THICKNESS
  const L = d.scale
  const y12 = fretY(L, 12)
  const zNut = fbTop(L) + 1.0
  const z12 = fbTop(y12) + 1.2 + 1.7
  const slope = (z12 - zNut) / (y12 - L)
  const stringZ = (y: number) => z12 + (y - y12) * slope
  return {
    neckTop,
    fbTop,
    stringZ,
    bodyTopAtBridge: bodyTopAt(0, 0),
    saddleZ: stringZ(0),
    pocketY,
    angle,
  }
}

// ------------------------------------------------------------------ pickguard

export function pickguardPoints(d: Design): ShapePoint[] | null {
  if (!d.pickguard.enabled) return null
  const src = d.pickguard.shape?.points ?? PICKGUARD_TEMPLATES[bodyTemplate(d.body.shapeId).defaults.pickguard ?? 's-guard'] ?? PICKGUARD_TEMPLATES['s-guard']
  return snapPocket(src, (p) => neckWidthAt(d, p.y) / 2 + 0.6)
}

/** Make a pickguard outline from the body: inset outline above the bridge. */
export function autoPickguard(d: Design): ShapePoint[] {
  const body = resolveBody(d)
  const cutY = 26
  const inset = body.outline.map((p, i, a) => {
    const prev = a[(i - 1 + a.length) % a.length]
    const next = a[(i + 1) % a.length]
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const l = Math.hypot(dx, dy) || 1
    return { x: p.x - (dy / l) * 7, y: p.y + (dx / l) * 7 }
  })
  const clipped: Vec2[] = []
  for (let i = 0; i < inset.length; i++) {
    const a = inset[i]
    const b = inset[(i + 1) % inset.length]
    const ain = a.y >= cutY
    const bin = b.y >= cutY
    if (ain) clipped.push(a)
    if (ain !== bin) {
      const t = (cutY - a.y) / (b.y - a.y)
      clipped.push({ x: a.x + (b.x - a.x) * t, y: cutY })
    }
  }
  const out: ShapePoint[] = []
  const step = Math.max(1, Math.floor(clipped.length / 36))
  for (let i = 0; i < clipped.length; i += step) {
    const p = clipped[i]
    out.push({ x: Math.round(p.x), y: Math.round(p.y), corner: Math.abs(p.y - cutY) < 0.01 })
  }
  return out
}

// ------------------------------------------------------------------ misc

export function fretPositions(d: Design): number[] {
  return Array.from({ length: d.frets + 1 }, (_, n) => fretY(d.scale, n))
}

export function bodyBlankNeeded(d: Design) {
  const b = resolveBody(d).bounds
  return { lengthIn: b.h / 25.4, widthIn: b.w / 25.4, thicknessIn: d.body.thickness / 25.4 }
}
