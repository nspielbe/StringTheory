import type { Design, Vec2 } from '../types'
import { ensureCCW, fretY, sampleOutline } from './geometry'
import { PICKUP_DIMS, fretboardEndY, neckWidthAt, pickguardPoints, placePickups, resolveBody, resolveHeadstock } from './layout'

// 1:1 printable build templates (SVG in millimetres): body outline with
// routes, headstock with tuner holes, pickguard, and a fret-slot ruler.

const path = (pts: Vec2[], ox = 0, oy = 0) => 'M' + pts.map((p) => `${(p.x + ox).toFixed(2)},${(-p.y + oy).toFixed(2)}`).join('L') + 'Z'

export function blueprintSvg(d: Design): { svg: string; widthMm: number; heightMm: number } {
  const body = resolveBody(d)
  const hs = resolveHeadstock(d)
  const bb = body.bounds
  const margin = 15
  const bodyOx = -bb.minX + margin
  const bodyOy = bb.maxY + margin + 12
  const parts: string[] = []
  const stroke = 'stroke="#000" fill="none" stroke-width="0.35"'
  const thin = 'stroke="#555" fill="none" stroke-width="0.2" stroke-dasharray="2 1.5"'
  const text = (x: number, y: number, s: string, size = 3.2, anchor = 'start') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" font-family="Helvetica, Arial" text-anchor="${anchor}" fill="#222">${s}</text>`

  // body
  parts.push(`<path d="${path(body.outline, bodyOx, bodyOy)}" ${stroke}/>`)
  parts.push(`<line x1="${bodyOx}" y1="${bodyOy - bb.maxY - 6}" x2="${bodyOx}" y2="${bodyOy - bb.minY + 6}" ${thin}/>`)
  parts.push(`<line x1="${bodyOx + bb.minX - 6}" y1="${bodyOy}" x2="${bodyOx + bb.maxX + 6}" y2="${bodyOy}" ${thin}/>`)
  parts.push(text(bodyOx + bb.maxX + 8, bodyOy + 1, 'bridge saddle line (scale ' + (d.scale / 25.4).toFixed(2) + '")', 2.6))
  // neck pocket / tenon
  const pocketTop = body.neckPocketY
  const heelEnd = Math.min(fretboardEndY(d) + 2, pocketTop - 20)
  const wTop = neckWidthAt(d, pocketTop)
  const wBot = neckWidthAt(d, heelEnd)
  parts.push(`<path d="${path([{ x: -wBot / 2, y: heelEnd }, { x: wBot / 2, y: heelEnd }, { x: wTop / 2, y: pocketTop + 2 }, { x: -wTop / 2, y: pocketTop + 2 }], bodyOx, bodyOy)}" ${stroke}/>`)
  parts.push(text(bodyOx + wTop / 2 + 3, bodyOy - (pocketTop + heelEnd) / 2, d.neck.construction === 'bolt-on' ? 'neck pocket' : 'neck tenon', 2.6))
  // pickups
  for (const p of placePickups(d)) {
    const dim = PICKUP_DIMS[p.slot.type]
    const w = dim.ring && !d.pickguard.enabled ? dim.w + 2 : p.w + 2
    const h = dim.h + 2
    const c = Math.cos(p.rot)
    const s = Math.sin(p.rot)
    const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => ({ x: p.x + x * c - y * s, y: p.y + x * s + y * c }))
    parts.push(`<path d="${path(corners, bodyOx, bodyOy)}" ${stroke}/>`)
    parts.push(text(bodyOx + p.x, bodyOy - p.y + 1, `${p.slot.position} ${p.slot.type}`, 2.4, 'middle'))
  }
  // controls
  const c = body.shape.controls
  const n = Math.min(4, d.electronics.volumes + d.electronics.tones)
  c.knobs.slice(0, n).forEach((k) => {
    parts.push(`<circle cx="${(k.x + bodyOx).toFixed(2)}" cy="${(-k.y + bodyOy).toFixed(2)}" r="4.75" ${stroke}/>`)
    parts.push(`<circle cx="${(k.x + bodyOx).toFixed(2)}" cy="${(-k.y + bodyOy).toFixed(2)}" r="0.6" fill="#000"/>`)
  })
  if (d.electronics.switchType !== 'none') parts.push(`<circle cx="${(c.switch.x + bodyOx).toFixed(2)}" cy="${(-c.switch.y + bodyOy).toFixed(2)}" r="${d.electronics.switchType === 'toggle3' ? 6 : 3}" ${stroke}/>`)
  parts.push(`<circle cx="${(c.jack.x + bodyOx).toFixed(2)}" cy="${(-c.jack.y + bodyOy).toFixed(2)}" r="11" ${thin}/>`)
  parts.push(text(bodyOx + c.jack.x, bodyOy - c.jack.y + 15, 'jack', 2.4, 'middle'))
  // bridge footprint
  parts.push(`<rect x="${bodyOx - 42}" y="${bodyOy - 12}" width="84" height="${d.hardware.bridge === 'tom' ? 74 : 50}" ${thin}/>`)
  parts.push(text(bodyOx, bodyOy + (d.hardware.bridge === 'tom' ? 66 : 42), 'bridge — verify with the hardware', 2.4, 'middle'))
  // pickguard
  const pg = pickguardPoints(d)
  if (pg) parts.push(`<path d="${path(ensureCCW(sampleOutline(pg, 2)), bodyOx, bodyOy)}" stroke="#2a62c9" fill="none" stroke-width="0.3"/>`)

  // headstock
  const hb = hs.bounds
  const headOx = bodyOx + bb.maxX + 60 - hb.minX
  const headOy = margin + 12 + hb.maxY
  parts.push(`<path d="${path(hs.outline, headOx, headOy)}" ${stroke}/>`)
  hs.posts.forEach((p) => parts.push(`<circle cx="${(p.x + headOx).toFixed(2)}" cy="${(-p.y + headOy).toFixed(2)}" r="5" ${stroke}/>`))
  parts.push(`<line x1="${headOx + hb.minX - 5}" y1="${headOy}" x2="${headOx + hb.maxX + 5}" y2="${headOy}" ${thin}/>`)
  parts.push(text(headOx + hb.maxX + 6, headOy + 1, 'nut', 2.6))
  parts.push(text(headOx + (hb.minX + hb.maxX) / 2, headOy + 8, `Headstock (${d.headstock.angle}° tilt) — 10 mm tuner holes`, 2.6, 'middle'))

  // fret ruler
  const rulerX = headOx + hb.minX
  const rulerY = headOy + 22
  const L = d.scale
  const fretLen = L - fretY(L, d.frets) + 10
  parts.push(`<line x1="${rulerX}" y1="${rulerY}" x2="${rulerX}" y2="${rulerY + fretLen}" stroke="#000" stroke-width="0.3"/>`)
  parts.push(text(rulerX + 2, rulerY - 2, 'Fret slots (from nut, mm)', 2.8))
  for (let k = 0; k <= d.frets; k++) {
    const dist = L - fretY(L, k)
    const y = rulerY + dist
    parts.push(`<line x1="${rulerX}" y1="${y.toFixed(2)}" x2="${rulerX + (k === 0 ? 30 : 18)}" y2="${y.toFixed(2)}" stroke="#000" stroke-width="${k === 0 ? 0.5 : 0.25}"/>`)
    parts.push(text(rulerX + 20, y + 1, `${k === 0 ? 'nut' : k}: ${dist.toFixed(2)}`, 2.3))
  }

  // title block
  const W = Math.max(headOx + hb.maxX + margin + 40, bodyOx + bb.maxX + margin + 80)
  const H = Math.max(bodyOy - bb.minY + margin + 10, rulerY + fretLen + margin)
  parts.push(text(margin, margin, `${escapeXml(d.name)} — 1:1 build templates`, 5))
  parts.push(text(margin, margin + 6, `Print at 100% (no scaling). Check the 50 mm scale bar. Scale ${d.scale} mm · ${d.frets} frets · nut ${d.neck.nutWidth} mm · body ${(d.body.thickness).toFixed(1)} mm thick`, 2.8))
  parts.push(`<line x1="${margin}" y1="${H - 8}" x2="${margin + 50}" y2="${H - 8}" stroke="#000" stroke-width="0.6"/>`)
  parts.push(text(margin, H - 10, '50 mm', 2.6))

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}"><rect width="100%" height="100%" fill="#fff"/>${parts.join('')}</svg>`
  return { svg, widthMm: W, heightMm: H }
}

function escapeXml(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!)
}
