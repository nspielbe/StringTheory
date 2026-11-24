import type { Decal, DecalZone, Design, Finish, InlaySettings, Vec2 } from '../types'
import { TILE_SIZES, woodTile } from './woodTextures'
import { getLoadedImage } from './imageStore'
import { GUARDS, guardSwatch, inlaySwatch } from './patterns'
import { fretboardEndY, neckWidthAt, resolveBody, resolveHeadstock, pickguardPoints } from './layout'
import { ensureCCW, fretY, sampleOutline } from './geometry'

// Bakes each surface "zone" of the guitar into a canvas in millimetre space:
// wood grain -> dye / burst / paint -> graphics -> clear-coat tint.

export interface Space {
  minX: number
  maxY: number
  s: number
  W: number
  H: number
  wMm: number
  hMm: number
}

export function makeSpace(minX: number, minY: number, maxX: number, maxY: number, s: number, pad = 4): Space {
  const x0 = minX - pad
  const y1 = maxY + pad
  const wMm = maxX - minX + pad * 2
  const hMm = maxY - minY + pad * 2
  return { minX: x0, maxY: y1, s, W: Math.ceil(wMm * s), H: Math.ceil(hMm * s), wMm, hMm }
}

const px = (sp: Space, p: Vec2): [number, number] => [(p.x - sp.minX) * sp.s, (sp.maxY - p.y) * sp.s]

function pathOf(sp: Space, pts: Vec2[]): Path2D {
  const p = new Path2D()
  pts.forEach((v, i) => {
    const [x, y] = px(sp, v)
    if (i) p.lineTo(x, y)
    else p.moveTo(x, y)
  })
  p.closePath()
  return p
}

function newCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(2, Math.min(8192, Math.round(w)))
  c.height = Math.max(2, Math.min(8192, Math.round(h)))
  return c
}

// ------------------------------------------------------------------ finish

function preWoodFilter(f: Finish): string {
  if (f.type === 'stain' || f.type === 'burst') {
    const k = f.strength
    return `saturate(${1 - 0.65 * k}) brightness(${1 + 0.12 * k}) contrast(${1.12 + 0.25 * k})`
  }
  return 'none'
}

/** Paint the finish onto a canvas that already holds bare wood (or nothing, for opaque finishes). */
function applyFinish(g: CanvasRenderingContext2D, f: Finish, w: number, h: number, edge?: { path: Path2D; s: number }) {
  g.save()
  if (f.type === 'solid' || f.type === 'metallic') {
    g.globalCompositeOperation = 'source-over'
    g.fillStyle = f.color
    g.fillRect(0, 0, w, h)
    if (f.type === 'metallic') sparkle(g, w, h, f.color)
  } else if (f.type === 'stain' || f.type === 'burst') {
    g.globalCompositeOperation = 'multiply'
    g.globalAlpha = Math.min(1, 0.35 + f.strength * 0.75)
    g.fillStyle = f.color
    g.fillRect(0, 0, w, h)
    g.globalAlpha = 1
    if (f.type === 'burst' && edge) {
      const bw = f.burstWidth * edge.s
      g.save()
      g.clip(edge.path)
      g.globalCompositeOperation = 'multiply'
      g.strokeStyle = f.burstColor
      g.filter = `blur(${Math.max(2, bw * 0.42)}px)`
      g.lineWidth = bw * 1.5
      g.stroke(edge.path)
      g.filter = `blur(${Math.max(1, bw * 0.16)}px)`
      g.lineWidth = bw * 0.55
      g.stroke(edge.path)
      g.filter = 'none'
      g.restore()
    }
  }
  if (f.amber > 0 && f.type !== 'solid' && f.type !== 'metallic') {
    g.globalCompositeOperation = 'multiply'
    g.globalAlpha = f.amber * 0.55
    g.fillStyle = '#f0b45a'
    g.fillRect(0, 0, w, h)
  }
  g.restore()
}

function sparkle(g: CanvasRenderingContext2D, w: number, h: number, base: string) {
  const n = Math.min(60000, (w * h) / 40)
  let s = 7
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  g.save()
  for (let i = 0; i < n; i++) {
    const v = r()
    g.globalAlpha = 0.25 + r() * 0.35
    g.fillStyle = v > 0.5 ? '#ffffff' : v > 0.2 ? base : '#000000'
    g.fillRect(r() * w, r() * h, 1.2, 1.2)
  }
  g.restore()
}

// ------------------------------------------------------------------ wood drawing

interface WoodDrawOpts {
  bookmatch?: boolean
  pieces?: 1 | 2 | 3
  filter?: string
}

/** Fill the canvas with wood whose grain runs along mm-y, centred on x = 0. */
function drawWoodBody(g: CanvasRenderingContext2D, sp: Space, tile: HTMLCanvasElement, opts: WoodDrawOpts, yMin: number, yMax: number) {
  const ts = TILE_SIZES.board
  const tileWmm = ts.w
  const tileHmm = Math.max(ts.h, yMax - yMin + 10)
  const [cx] = px(sp, { x: 0, y: 0 })
  const top = (sp.maxY - (yMin + tileHmm)) * sp.s
  const hPx = tileHmm * sp.s
  const wPx = tileWmm * sp.s
  g.save()
  g.filter = opts.filter ?? 'none'
  const pieces = opts.bookmatch ? 2 : opts.pieces ?? 2
  if (pieces === 1) {
    const full = Math.max(sp.wMm, tileWmm)
    g.drawImage(tile, (0 - sp.minX - full / 2) * sp.s, top, full * sp.s, hPx)
  } else if (pieces === 2) {
    // right half
    g.drawImage(tile, cx, top, wPx, hPx)
    // left half: mirror (bookmatched) or a second board
    g.save()
    g.translate(cx, 0)
    g.scale(-1, 1)
    if (opts.bookmatch) g.drawImage(tile, 0, top, wPx, hPx)
    else g.drawImage(tile, tile.width * 0.35, 0, tile.width * 0.65, tile.height, 0, top, wPx * 0.65, hPx)
    g.restore()
    if (!opts.bookmatch) drawWoodBody2(g, tile, cx, top, wPx, hPx)
  } else {
    const third = (sp.wMm / 3) * sp.s
    g.drawImage(tile, 0, 0, tile.width * 0.5, tile.height, cx - third / 2, top, third, hPx)
    g.drawImage(tile, tile.width * 0.5, 0, tile.width * 0.5, tile.height, cx + third / 2, top, wPx, hPx)
    g.save()
    g.translate(cx - third / 2, 0)
    g.scale(-1, 1)
    g.drawImage(tile, tile.width * 0.2, 0, tile.width * 0.8, tile.height, 0, top, wPx, hPx)
    g.restore()
  }
  g.restore()
}

function drawWoodBody2(g: CanvasRenderingContext2D, tile: HTMLCanvasElement, cx: number, top: number, wPx: number, hPx: number) {
  // Fill any remaining width on the left with a second slice so wide bodies stay covered.
  g.save()
  g.translate(cx - wPx * 0.65, 0)
  g.scale(-1, 1)
  g.drawImage(tile, 0, 0, tile.width * 0.6, tile.height, 0, top, wPx * 0.6, hPx)
  g.restore()
}

// ------------------------------------------------------------------ decals

const procCache = new Map<string, HTMLCanvasElement>()

function decalKey(d: Decal) {
  return [d.imageId, d.crop.x, d.crop.y, d.crop.w, d.crop.h, d.mask, d.removeWhite, d.hue, d.saturation, d.brightness, d.contrast, d.grayscale, d.invert, d.material, d.color, d.tintAmount].join('|')
}

/** Crop, filter, key out white, mask and recolour an image into a ready-to-stamp canvas. */
export function processDecal(d: Decal): HTMLCanvasElement | null {
  const img = getLoadedImage(d.imageId)
  if (!img) return null
  const key = decalKey(d)
  const hit = procCache.get(key)
  if (hit) return hit
  const sx = d.crop.x * img.naturalWidth
  const sy = d.crop.y * img.naturalHeight
  const sw = Math.max(1, d.crop.w * img.naturalWidth)
  const sh = Math.max(1, d.crop.h * img.naturalHeight)
  const scale = Math.min(1, 1600 / Math.max(sw, sh))
  const c = newCanvas(sw * scale, sh * scale)
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.filter = `hue-rotate(${d.hue}deg) saturate(${d.saturation}) brightness(${d.brightness}) contrast(${d.contrast})${d.grayscale ? ' grayscale(1)' : ''}${d.invert ? ' invert(1)' : ''}`
  g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height)
  g.filter = 'none'
  if (d.removeWhite > 0) {
    const id = g.getImageData(0, 0, c.width, c.height)
    const a = id.data
    const thr = 255 - d.removeWhite * 160
    for (let i = 0; i < a.length; i += 4) {
      const m = Math.min(a[i], a[i + 1], a[i + 2])
      if (m >= thr) a[i + 3] = 0
      else if (m > thr - 30) a[i + 3] *= (thr - m) / 30
    }
    g.putImageData(id, 0, 0)
  }
  if (d.mask !== 'none') {
    g.globalCompositeOperation = 'destination-in'
    g.beginPath()
    if (d.mask === 'circle') g.ellipse(c.width / 2, c.height / 2, c.width / 2, c.height / 2, 0, 0, Math.PI * 2)
    else g.roundRect(0, 0, c.width, c.height, Math.min(c.width, c.height) * 0.12)
    g.fill()
    g.globalCompositeOperation = 'source-over'
  }
  if (d.material !== 'image') {
    g.globalCompositeOperation = 'source-in'
    if (d.material === 'color') g.fillStyle = d.color
    else if (d.material === 'mop') g.fillStyle = g.createPattern(inlaySwatch('mop'), 'repeat')!
    else if (d.material === 'abalone') g.fillStyle = g.createPattern(inlaySwatch('abalone'), 'repeat')!
    else if (d.material === 'gold-leaf') {
      const gr = g.createLinearGradient(0, 0, c.width, c.height)
      gr.addColorStop(0, '#f9e08a')
      gr.addColorStop(0.5, '#c8942d')
      gr.addColorStop(1, '#f5d77a')
      g.fillStyle = gr
    } else {
      const gr = g.createLinearGradient(0, 0, 0, c.height)
      gr.addColorStop(0, '#f4f6f8')
      gr.addColorStop(0.5, '#8d949b')
      gr.addColorStop(1, '#e8ecef')
      g.fillStyle = gr
    }
    g.fillRect(0, 0, c.width, c.height)
    g.globalCompositeOperation = 'source-over'
  } else if (d.tintAmount > 0) {
    g.globalCompositeOperation = 'source-atop'
    g.globalAlpha = d.tintAmount
    g.fillStyle = d.color
    g.fillRect(0, 0, c.width, c.height)
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
  }
  procCache.set(key, c)
  if (procCache.size > 40) procCache.delete(procCache.keys().next().value!)
  return c
}

function drawDecals(g: CanvasRenderingContext2D, sp: Space, decals: Decal[], zone: DecalZone, clip: Path2D, mirrorX = false) {
  const list = decals.filter((d) => d.zone === zone && d.visible)
  if (!list.length) return
  g.save()
  g.clip(clip)
  for (const d of list) {
    const c = processDecal(d)
    if (!c) continue
    const w = d.width * sp.s
    const h = (w * c.height) / c.width
    const [x, y] = px(sp, { x: mirrorX ? -d.x : d.x, y: d.y })
    g.save()
    g.globalAlpha = d.opacity
    g.globalCompositeOperation = d.blend
    g.translate(x, y)
    if (mirrorX) g.scale(-1, 1)
    g.rotate((-d.rotation * Math.PI) / 180)
    g.scale(d.flipX ? -1 : 1, 1)
    g.drawImage(c, -w / 2, -h / 2, w, h)
    g.restore()
  }
  g.restore()
}

// ------------------------------------------------------------------ zones

export interface Baked {
  canvas: HTMLCanvasElement
  space: Space
}

function topFinish(d: Design): Finish {
  return d.body.top.enabled ? d.finish.top : d.finish.body
}

export async function bakeBodyFace(d: Design, face: 'top' | 'back'): Promise<Baked> {
  const body = resolveBody(d)
  const b = body.bounds
  const longest = Math.max(b.w, b.h)
  const s = Math.min(4.2, 2300 / longest)
  const sp = makeSpace(b.minX, b.minY, b.maxX, b.maxY, s)
  const c = newCanvas(sp.W, sp.H)
  const g = c.getContext('2d')!
  const path = pathOf(sp, body.outline)
  const isTop = face === 'top'
  const useTopWood = isTop && d.body.top.enabled
  const fin = isTop ? topFinish(d) : d.finish.body
  const woodId = useTopWood ? d.body.top.wood : d.body.wood
  const opaque = fin.type === 'solid' || fin.type === 'metallic'
  if (!opaque) {
    const tile = await woodTile(woodId, d.body.seed + (useTopWood ? 7 : 0), d.body.figure, 'board')
    drawWoodBody(g, sp, tile, { bookmatch: useTopWood, pieces: d.body.pieces, filter: preWoodFilter(fin) }, b.minY, b.maxY)
    if (d.neck.construction === 'neck-through' && !useTopWood) await neckThroughStripe(g, sp, d, preWoodFilter(fin))
  }
  applyFinish(g, fin, c.width, c.height, { path, s })
  if (isTop && d.body.top.enabled && d.body.top.naturalEdge && !opaque) {
    // Unstained top edge reads like binding.
    const tile = await woodTile(woodId, d.body.seed + 7, d.body.figure, 'board')
    g.save()
    g.clip(path)
    const band = newCanvas(c.width, c.height)
    const bg = band.getContext('2d')!
    drawWoodBody(bg, sp, tile, { bookmatch: true }, b.minY, b.maxY)
    applyFinish(bg, { ...fin, type: 'natural' }, c.width, c.height)
    bg.globalCompositeOperation = 'destination-in'
    bg.lineWidth = 5.5 * s
    bg.stroke(path)
    g.drawImage(band, 0, 0)
    g.restore()
  }
  drawDecals(g, sp, d.decals, face, path, face === 'back')
  if (isTop && d.body.binding.enabled) {
    g.save()
    g.clip(path)
    g.strokeStyle = d.body.binding.color
    g.lineWidth = d.body.binding.width * 2 * s
    g.stroke(path)
    g.restore()
  }
  return { canvas: c, space: sp }
}

async function neckThroughStripe(g: CanvasRenderingContext2D, sp: Space, d: Design, filter: string) {
  const body = resolveBody(d)
  const w = neckWidthAt(d, body.neckPocketY) + 4
  const tile = await woodTile(d.neck.wood, d.neck.seed, 0.6, 'long')
  const [x0] = px(sp, { x: -w / 2, y: 0 })
  g.save()
  g.filter = filter
  g.drawImage(tile, x0, 0, w * sp.s, sp.H)
  g.restore()
}

/** Side walls: u = position around the outline, v = height. */
export async function bakeSides(d: Design): Promise<Baked> {
  const body = resolveBody(d)
  let P = 0
  for (let i = 0; i < body.outline.length; i++) {
    const a = body.outline[i]
    const b2 = body.outline[(i + 1) % body.outline.length]
    P += Math.hypot(b2.x - a.x, b2.y - a.y)
  }
  const T = d.body.thickness
  const s = Math.min(3, 4096 / P)
  const W = P * s
  const H = T * s
  const sp: Space = { minX: 0, maxY: T, s, W: Math.ceil(W), H: Math.ceil(H), wMm: P, hMm: T }
  const c = newCanvas(W, H)
  const g = c.getContext('2d')!
  const bodyTile = await woodTile(d.body.wood, d.body.seed + 3, d.body.figure, 'board')
  const fb = d.finish.body
  const paintWood = (tile: HTMLCanvasElement, y0: number, y1: number, fin: Finish) => {
    const layer = newCanvas(W, H)
    const lg = layer.getContext('2d')!
    if (fin.type !== 'solid' && fin.type !== 'metallic') {
      lg.filter = preWoodFilter(fin)
      // grain runs along the perimeter
      const tw = TILE_SIZES.board.h * s
      const th = TILE_SIZES.board.w * s
      for (let x = 0; x < W; x += tw) {
        lg.save()
        lg.translate(x, 0)
        lg.rotate(-Math.PI / 2)
        lg.drawImage(tile, -th, 0, th, tw)
        lg.restore()
      }
      lg.filter = 'none'
    }
    applyFinish(lg, fin, W, H)
    if (fin.type === 'burst') {
      lg.globalCompositeOperation = 'multiply'
      lg.globalAlpha = 0.85
      lg.fillStyle = fin.burstColor
      lg.fillRect(0, 0, W, H)
      lg.globalAlpha = 1
    }
    const top = (T - y1) * s
    g.drawImage(layer, 0, top, W, (y1 - y0) * s, 0, top, W, (y1 - y0) * s)
  }
  const topOn = d.body.top.enabled
  const topBand = topOn ? Math.max(2.5, d.body.top.carved ? d.body.top.thickness - d.body.top.carveHeight : d.body.top.thickness) : 0
  paintWood(bodyTile, 0, T - topBand, fb)
  if (topOn) {
    const topTile = await woodTile(d.body.top.wood, d.body.seed + 7, d.body.figure, 'board')
    const tf = d.body.top.naturalEdge ? { ...d.finish.top, type: 'natural' as const } : d.finish.top
    paintWood(topTile, T - topBand, T, tf)
  }
  if (d.body.binding.enabled) {
    g.fillStyle = d.body.binding.color
    g.fillRect(0, 0, W, Math.max(2, d.body.binding.width * 1.8 * s))
  }
  return { canvas: c, space: sp }
}

/** Neck wood (back of neck, heel, headstock back/sides). Planar: u = x/90 + .5, v = y/1000. */
export async function bakeNeckWood(d: Design): Promise<Baked> {
  const tile = await woodTile(d.neck.wood, d.neck.seed, 0.7, 'long')
  const c = newCanvas(tile.width, tile.height)
  const g = c.getContext('2d')!
  const f = d.finish.neck
  g.filter = preWoodFilter(f)
  if (f.type !== 'solid' && f.type !== 'metallic') g.drawImage(tile, 0, 0)
  g.filter = 'none'
  applyFinish(g, f.type === 'burst' ? { ...f, type: 'stain' } : f, c.width, c.height)
  const sp: Space = { minX: -45, maxY: 1000, s: tile.width / 90, W: c.width, H: c.height, wMm: 90, hMm: 1000 }
  return { canvas: c, space: sp }
}

export function headFinish(d: Design): Finish | null {
  switch (d.headstock.faceFinish) {
    case 'match-body': return d.finish.body
    case 'match-top': return d.body.top.enabled ? d.finish.top : d.finish.body
    case 'match-neck': return d.finish.neck
    default: return d.finish.head
  }
}

export async function bakeHeadFace(d: Design): Promise<Baked> {
  const hs = resolveHeadstock(d)
  const b = hs.bounds
  const s = 5
  const sp = makeSpace(b.minX, b.minY, b.maxX, b.maxY, s)
  const c = newCanvas(sp.W, sp.H)
  const g = c.getContext('2d')!
  const path = pathOf(sp, hs.outline)
  const f = headFinish(d) ?? d.finish.neck
  const woodId = d.headstock.faceFinish === 'match-top' && d.body.top.enabled ? d.body.top.wood : d.headstock.veneer ?? d.neck.wood
  if (f.type !== 'solid' && f.type !== 'metallic') {
    const tile = await woodTile(woodId, d.neck.seed + 11, d.body.figure, 'small')
    g.filter = preWoodFilter(f)
    const tw = TILE_SIZES.small.w * s
    const th = TILE_SIZES.small.h * s
    g.drawImage(tile, (0 - sp.minX) * s - tw / 2, 0, tw, Math.max(th, c.height))
    g.filter = 'none'
  }
  applyFinish(g, f, c.width, c.height, { path, s })
  drawDecals(g, sp, d.decals, 'headstock', path)
  return { canvas: c, space: sp }
}

// ------------------------------------------------------------------ fretboard + inlays

export async function bakeFretboard(d: Design): Promise<Baked> {
  const L = d.scale
  const yEnd = fretboardEndY(d)
  const wMax = neckWidthAt(d, yEnd) + 2
  const s = Math.min(9, 4000 / (L - yEnd + 4))
  const sp = makeSpace(-wMax / 2, yEnd - 1, wMax / 2, L + 1, s, 0)
  const c = newCanvas(sp.W, sp.H)
  const g = c.getContext('2d')!
  const tile = await woodTile(d.neck.fretboardWood, d.neck.seed + 5, 0.6, 'long')
  g.drawImage(tile, 0, 0, tile.width, tile.height, 0, 0, c.width, Math.max(c.height, (TILE_SIZES.long.h * s * c.width) / (TILE_SIZES.long.w * s)))
  if (d.finish.fretboard === 'oil') {
    g.globalCompositeOperation = 'multiply'
    g.globalAlpha = 0.12
    g.fillStyle = '#8a6a4a'
    g.fillRect(0, 0, c.width, c.height)
  } else {
    g.globalCompositeOperation = 'multiply'
    g.globalAlpha = 0.2
    g.fillStyle = '#f0c070'
    g.fillRect(0, 0, c.width, c.height)
  }
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = 1
  drawInlays(g, sp, d)
  if (d.neck.fretboardBinding.enabled) {
    g.fillStyle = d.neck.fretboardBinding.color
    // binding follows the taper: draw two thin quads along the edges
    const edge = (side: number) => {
      const p = new Path2D()
      const a = px(sp, { x: (side * neckWidthAt(d, L)) / 2, y: L })
      const b = px(sp, { x: (side * neckWidthAt(d, yEnd)) / 2, y: yEnd })
      const k = 1.6 * s * side
      p.moveTo(a[0], a[1])
      p.lineTo(b[0], b[1])
      p.lineTo(b[0] - k, b[1])
      p.lineTo(a[0] - k, a[1])
      p.closePath()
      g.fill(p)
    }
    edge(-1)
    edge(1)
  }
  return { canvas: c, space: sp }
}

function inlayFill(g: CanvasRenderingContext2D, inl: InlaySettings): string | CanvasPattern {
  if (inl.material === 'color') return inl.color
  return g.createPattern(inlaySwatch(inl.material, inl.color), 'repeat') ?? '#fff'
}

function drawInlays(g: CanvasRenderingContext2D, sp: Space, d: Design) {
  const inl = d.inlays
  if (inl.pattern === 'none') return
  const fill = inlayFill(g, inl)
  const L = d.scale
  if (inl.pattern === 'spanning-image') {
    if (!inl.imageId) return
    const img = getLoadedImage(inl.imageId)
    if (!img) return
    const art = imageInlay(img, inl)
    const yTop = L - inl.spanStart
    const w0 = neckWidthAt(d, yTop - 60) * 0.86 * inl.size
    const len = inl.spanStretch ? inl.spanLength : (w0 * art.height) / art.width
    const w = inl.spanStretch ? neckWidthAt(d, yTop - len / 2) * 0.86 * inl.size : w0
    const [x0, y0] = px(sp, { x: -w / 2, y: yTop })
    g.save()
    g.drawImage(art, x0, y0, w * sp.s, len * sp.s)
    g.restore()
    return
  }
  const S = inl.size
  for (const n of inl.frets) {
    if (n > d.frets || n < 1) continue
    const ya = fretY(L, n - 1)
    const yb = fretY(L, n)
    const yc = (ya + yb) / 2
    const sp_ = ya - yb
    const W = neckWidthAt(d, yc)
    const dbl = inl.doubleAt12 && (n === 12 || n === 24)
    g.fillStyle = fill
    const poly = (pts: Vec2[]) => {
      const p = new Path2D()
      pts.forEach((v, i) => {
        const [x, y] = px(sp, v)
        if (i) p.lineTo(x, y)
        else p.moveTo(x, y)
      })
      p.closePath()
      g.fill(p)
      g.save()
      g.strokeStyle = 'rgba(0,0,0,0.25)'
      g.lineWidth = 0.25 * sp.s
      g.stroke(p)
      g.restore()
    }
    const dot = (x: number, r: number) => {
      const [cx, cy] = px(sp, { x, y: yc })
      g.beginPath()
      g.arc(cx, cy, r * sp.s, 0, Math.PI * 2)
      g.fill()
      g.save()
      g.strokeStyle = 'rgba(0,0,0,0.25)'
      g.lineWidth = 0.25 * sp.s
      g.stroke()
      g.restore()
    }
    const r = 3.2 * S
    switch (inl.pattern) {
      case 'dots':
        if (dbl) {
          dot(-W * 0.24, r)
          dot(W * 0.24, r)
        } else dot(0, r)
        break
      case 'offset-dots':
        if (dbl) {
          dot(-W * 0.3, r * 0.85)
          dot(-W * 0.12, r * 0.85)
        } else dot(-W * 0.28, r * 0.85)
        break
      case 'blocks': {
        const bw = W * 0.8 * Math.min(1.1, S)
        const bh = Math.min(sp_ * 0.62, 26) * S
        poly([{ x: -bw / 2, y: yc - bh / 2 }, { x: bw / 2, y: yc - bh / 2 }, { x: bw / 2, y: yc + bh / 2 }, { x: -bw / 2, y: yc + bh / 2 }])
        break
      }
      case 'trapezoids': {
        const bw = W * 0.74 * Math.min(1.1, S)
        const hl = Math.min(sp_ * 0.62, 26) * S
        const hr = hl * 0.62
        poly([{ x: -bw / 2, y: yc - hl / 2 }, { x: bw / 2, y: yc - hr / 2 }, { x: bw / 2, y: yc + hr / 2 }, { x: -bw / 2, y: yc + hl / 2 }])
        break
      }
      case 'sharktooth': {
        const bw = W * 0.84
        const h = sp_ * 0.8 * S
        poly([{ x: -bw / 2, y: yb + sp_ * 0.12 }, { x: bw / 2, y: yb + sp_ * 0.12 }, { x: bw / 2, y: yb + sp_ * 0.12 + h }])
        break
      }
      case 'diamonds': {
        const bw = W * 0.46 * S
        const bh = Math.min(sp_ * 0.6, 22) * S
        if (dbl) {
          for (const ox of [-W * 0.22, W * 0.22])
            poly([{ x: ox, y: yc - bh / 2 }, { x: ox + bw / 3, y: yc }, { x: ox, y: yc + bh / 2 }, { x: ox - bw / 3, y: yc }])
        } else poly([{ x: 0, y: yc - bh / 2 }, { x: bw / 2, y: yc }, { x: 0, y: yc + bh / 2 }, { x: -bw / 2, y: yc }])
        break
      }
      case 'crescents': {
        const R = Math.min(sp_ * 0.34, 11) * S
        const [cx, cy] = px(sp, { x: 0, y: yc })
        const moon = new Path2D()
        moon.arc(cx, cy, R * sp.s, 0, Math.PI * 2)
        const cut = new Path2D()
        cut.arc(cx + R * 0.45 * sp.s, cy - R * 0.2 * sp.s, R * 0.82 * sp.s, 0, Math.PI * 2)
        const tmp = newCanvas(R * 2.4 * sp.s, R * 2.4 * sp.s)
        const tg = tmp.getContext('2d')!
        tg.translate(-cx + tmp.width / 2, -cy + tmp.height / 2)
        tg.fillStyle = inlayFill(tg, inl)
        tg.fill(moon)
        tg.globalCompositeOperation = 'destination-out'
        if (n !== 12) tg.fill(cut)
        g.drawImage(tmp, cx - tmp.width / 2, cy - tmp.height / 2)
        break
      }
      case 'triangles': {
        const h = sp_ * 0.5 * S
        const x0 = -W / 2 + 1.5
        poly([{ x: x0, y: yc - h / 2 }, { x: x0 + W * 0.28 * S, y: yc }, { x: x0, y: yc + h / 2 }])
        break
      }
      case 'image': {
        if (!inl.imageId) break
        const img = getLoadedImage(inl.imageId)
        if (!img) break
        const art = imageInlay(img, inl)
        const maxW = W * 0.8 * S
        const maxH = sp_ * 0.7 * S
        const k = Math.min(maxW / art.width, maxH / art.height)
        const w = art.width * k
        const h = art.height * k
        const [cx, cy] = px(sp, { x: 0, y: yc })
        g.drawImage(art, cx - (w * sp.s) / 2, cy - (h * sp.s) / 2, w * sp.s, h * sp.s)
        break
      }
    }
  }
}

const inlayArtCache = new Map<string, HTMLCanvasElement>()

/** Picture or material-filled silhouette of an image (dark/opaque pixels = inlay). */
function imageInlay(img: HTMLImageElement, inl: InlaySettings): HTMLCanvasElement {
  const key = img.src.slice(-64) + img.naturalWidth + '|' + inl.imageAsMask + inl.material + inl.color
  const hit = inlayArtCache.get(key)
  if (hit) return hit
  const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight))
  const c = newCanvas(img.naturalWidth * k, img.naturalHeight * k)
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0, c.width, c.height)
  if (inl.imageAsMask) {
    const id = g.getImageData(0, 0, c.width, c.height)
    const a = id.data
    let opaque = true
    for (let i = 3; i < a.length; i += 4 * 97) if (a[i] < 250) opaque = false
    for (let i = 0; i < a.length; i += 4) {
      const lum = (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11) / 255
      // Transparent PNG: use alpha. Opaque art: dark ink becomes inlay.
      const alpha = opaque ? Math.max(0, Math.min(1, (0.75 - lum) * 4)) : a[i + 3] / 255
      a[i + 3] = alpha * 255
    }
    g.putImageData(id, 0, 0)
    g.globalCompositeOperation = 'source-in'
    g.fillStyle = inl.material === 'color' ? inl.color : g.createPattern(inlaySwatch(inl.material, inl.color), 'repeat')!
    g.fillRect(0, 0, c.width, c.height)
  }
  inlayArtCache.set(key, c)
  return c
}

// ------------------------------------------------------------------ pickguard

export async function bakePickguard(d: Design): Promise<Baked | null> {
  const pts = pickguardPoints(d)
  if (!pts) return null
  const outline = ensureCCW(sampleOutline(pts, 2))
  const body = resolveBody(d)
  const b = body.bounds
  const s = 3
  const sp = makeSpace(b.minX, b.minY, b.maxX, b.maxY, s)
  const c = newCanvas(sp.W, sp.H)
  const g = c.getContext('2d')!
  const look = GUARDS[d.pickguard.material]
  const sw = guardSwatch(d.pickguard.material)
  g.fillStyle = g.createPattern(sw, 'repeat')!
  g.fillRect(0, 0, c.width, c.height)
  if (look.clear) {
    g.clearRect(0, 0, c.width, c.height)
    g.fillStyle = 'rgba(255,255,255,0.06)'
    g.fillRect(0, 0, c.width, c.height)
  }
  drawDecals(g, sp, d.decals, 'pickguard', pathOf(sp, outline))
  return { canvas: c, space: sp }
}
