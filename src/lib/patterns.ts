import type { InlayMaterial, PickguardMaterial } from '../types'

// Small procedural material swatches (pearl, abalone, pickguard plastics)
// used as canvas fill patterns when baking textures.

const cache = new Map<string, HTMLCanvasElement>()

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function rand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function swirl(palette: string[], base: string, seed: number, blobs = 140, size = 256, alpha = 0.35) {
  const c = canvas(size, size)
  const g = c.getContext('2d')!
  g.fillStyle = base
  g.fillRect(0, 0, size, size)
  const r = rand(seed)
  for (let i = 0; i < blobs; i++) {
    const x = r() * size
    const y = r() * size
    const rx = 6 + r() * 38
    const ry = 3 + r() * 14
    g.save()
    g.translate(x, y)
    g.rotate(r() * Math.PI)
    const col = palette[Math.floor(r() * palette.length)]
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, rx)
    grd.addColorStop(0, col)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalAlpha = alpha * (0.5 + r() * 0.5)
    g.fillStyle = grd
    g.scale(1, ry / rx)
    g.beginPath()
    g.arc(0, 0, rx, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  // fine sheen lines
  g.globalAlpha = 0.12
  g.strokeStyle = '#ffffff'
  for (let i = 0; i < 40; i++) {
    g.beginPath()
    const y = r() * size
    g.moveTo(0, y)
    g.bezierCurveTo(size * 0.3, y + (r() - 0.5) * 30, size * 0.6, y + (r() - 0.5) * 30, size, y + (r() - 0.5) * 20)
    g.stroke()
  }
  g.globalAlpha = 1
  return c
}

export function inlaySwatch(m: InlayMaterial, color = '#ffffff'): HTMLCanvasElement {
  const key = 'inlay|' + m + '|' + color
  const hit = cache.get(key)
  if (hit) return hit
  let c: HTMLCanvasElement
  switch (m) {
    case 'mop':
      c = swirl(['#ffe7f3', '#e3fff6', '#e7ecff', '#fff7dc', '#ffffff'], '#f4f1ea', 11, 160, 256, 0.55)
      break
    case 'abalone':
      c = swirl(['#2fe0c0', '#4a8cff', '#a45cff', '#3cf08f', '#ff7ad1', '#9be8ff', '#d4ff6a'], '#2a9a98', 23, 260, 256, 0.85)
      break
    case 'gold-mop':
      c = swirl(['#fff0b8', '#f1c96a', '#fff8e0', '#e0a84a'], '#ecd59a', 31, 160, 256, 0.6)
      break
    case 'black-pearl':
      c = swirl(['#3b4a5e', '#5e3b5a', '#2f5a53', '#6a6a74'], '#1c1c22', 41, 160, 256, 0.6)
      break
    case 'pearloid':
      c = swirl(['#fffaf0', '#e8dfcc', '#ffffff', '#d9cfb8'], '#efe7d6', 53, 120, 256, 0.7)
      break
    case 'clay':
      c = flat('#e9dcc0')
      break
    case 'glow':
      c = flat('#d9f7e4')
      break
    case 'maple':
      c = flat('#efdcb2')
      break
    case 'ebony':
      c = flat('#141110')
      break
    default:
      c = flat(color)
  }
  cache.set(key, c)
  return c
}

function flat(col: string) {
  const c = canvas(8, 8)
  const g = c.getContext('2d')!
  g.fillStyle = col
  g.fillRect(0, 0, 8, 8)
  return c
}

export const INLAY_LABEL: Record<InlayMaterial, string> = {
  mop: 'Mother of pearl',
  abalone: 'Abalone',
  'gold-mop': 'Gold pearl',
  'black-pearl': 'Black pearl',
  pearloid: 'Pearloid (vintage)',
  clay: 'Clay dots',
  glow: 'Glow (luminlay)',
  color: 'Solid colour',
  maple: 'Maple',
  ebony: 'Ebony / black',
}

export interface GuardLook {
  base: string
  layers: string[]
  pattern?: 'tortoise' | 'pearloid'
  label: string
  productId: string
  clear?: boolean
}

export const GUARDS: Record<PickguardMaterial, GuardLook> = {
  black: { base: '#101010', layers: ['#101010'], label: 'Black', productId: 'sm-pg-black' },
  white: { base: '#f3f1ea', layers: ['#f3f1ea'], label: 'White', productId: 'sm-pg-white' },
  cream: { base: '#ead9b0', layers: ['#ead9b0'], label: 'Cream', productId: 'sm-pg-cream' },
  bwb: { base: '#0f0f0f', layers: ['#0f0f0f', '#f5f5f5', '#0f0f0f'], label: 'Black/White/Black', productId: 'sm-pg-bwb' },
  wbw: { base: '#f3f1ea', layers: ['#f3f1ea', '#111111', '#f3f1ea'], label: 'White/Black/White', productId: 'sm-pg-wbw' },
  tortoise: { base: '#5a1f0c', layers: ['#5a1f0c', '#f0e8d8', '#111'], pattern: 'tortoise', label: 'Tortoise', productId: 'sm-pg-tortoise' },
  pearloid: { base: '#efe9dd', layers: ['#efe9dd', '#ffffff', '#111'], pattern: 'pearloid', label: 'Pearloid', productId: 'sm-pg-pearloid' },
  clear: { base: 'rgba(255,255,255,0.08)', layers: ['rgba(255,255,255,0.1)'], label: 'Clear', productId: 'sm-pg-clear', clear: true },
  mint: { base: '#e6eedc', layers: ['#e6eedc', '#111', '#e6eedc'], label: 'Mint green (5-ply)', productId: 'sm-pg-5ply' },
}

export function guardSwatch(m: PickguardMaterial): HTMLCanvasElement {
  const key = 'guard|' + m
  const hit = cache.get(key)
  if (hit) return hit
  const look = GUARDS[m]
  let c: HTMLCanvasElement
  if (look.pattern === 'tortoise') c = swirl(['#1a0802', '#8a3a10', '#2b0f04', '#a4561c', '#120501'], '#5a1f0c', 77, 260, 256, 0.85)
  else if (look.pattern === 'pearloid') c = inlaySwatch('pearloid')
  else c = flat(look.base)
  cache.set(key, c)
  return c
}
