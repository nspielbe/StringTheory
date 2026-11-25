import type { BridgeType, Design, PickupLayout } from '../types'
import { bodyTemplate } from '../data/bodyShapes'
import { headstockTemplate } from '../data/headstockShapes'
import { PRODUCTS, bridgesFor, pickupsFor, tunersFor } from '../data/catalog'
import { defaultBridgeProduct, defaultPickup, defaultTuners, slotsFor } from '../data/presets'

// Compound edits that keep a design self-consistent.

export function applyBodyTemplate(d: Design, id: string, full: boolean) {
  const t = bodyTemplate(id)
  const x = t.defaults
  d.body.shapeId = id
  d.body.custom = null
  d.body.thickness = x.thickness
  d.body.edgeRadius = x.edgeRadius
  d.body.backRadius = x.backRadius
  d.body.chamfer = x.chamfer
  d.body.armContour = x.armContour
  d.body.bellyCut = x.bellyCut
  if (x.carved) {
    d.body.top.enabled = true
    d.body.top.carved = true
    d.body.top.carveHeight = x.carveHeight
    d.body.top.carveWidth = x.carveWidth
    d.body.top.recurve = x.recurve
    d.body.top.thickness = Math.max(d.body.top.thickness, 14)
  } else if (d.body.top.carved) {
    d.body.top.carved = false
    d.body.top.thickness = 6
  }
  d.pickguard.enabled = !!x.pickguard
  d.pickguard.shape = null
  d.neck.angle = x.neckAngle
  if (full) {
    d.scale = x.scale
    d.frets = x.frets
    d.neck.nutWidth = d.strings === 7 ? x.nutWidth + 5.1 : x.nutWidth
    d.neck.taper = d.strings === 7 ? x.taper + 0.5 : x.taper
    d.neck.construction = x.construction
    setHeadstock(d, x.headstock)
    setBridge(d, x.bridge)
    setPickupLayout(d, x.pickups)
    d.electronics.switchType = x.switchType
    d.electronics.jack = x.jack
    d.electronics.volumes = x.volumes
    d.electronics.tones = x.tones
  }
}

export function setHeadstock(d: Design, id: string) {
  const t = headstockTemplate(id)
  d.headstock.shapeId = id
  d.headstock.custom = null
  d.headstock.angle = t.angle
  const cur = PRODUCTS[d.hardware.tunerProductId]
  const mode = t.shape.tuners.mode
  const ok = mode !== 'none' && cur && tunersFor(mode, d.strings).some((p) => p.id === cur.id)
  if (!ok) d.hardware.tunerProductId = defaultTuners(id, d.strings)
  if (mode === 'none' && !d.hardware.bridge.startsWith('headless')) setBridge(d, 'headless-fixed')
  if (mode !== 'none' && d.hardware.bridge.startsWith('headless')) setBridge(d, 'fixed')
}

export function setBridge(d: Design, type: BridgeType) {
  d.hardware.bridge = type
  const cur = PRODUCTS[d.hardware.bridgeProductId]
  if (!cur || cur.bridge?.type !== type || !cur.bridge.strings.includes(d.strings)) d.hardware.bridgeProductId = defaultBridgeProduct(type, d.strings)
}

export function setPickupLayout(d: Design, layout: PickupLayout) {
  const old = d.pickups
  d.pickupLayout = layout
  const modern = !['s-style', 't-style', 'offset-style'].includes(d.body.shapeId) || d.hardware.color === 'black'
  d.pickups = slotsFor(layout, d.strings, modern).map((s) => {
    const prev = old.find((o) => o.position === s.position && o.type === s.type)
    return prev ? { ...s, productId: prev.productId, cover: prev.cover, offset: prev.offset, slant: prev.slant } : s
  })
}

export function setStrings(d: Design, n: 6 | 7) {
  if (d.strings === n) return
  d.strings = n
  const nd = bodyTemplate(d.body.shapeId).defaults
  d.neck.nutWidth = n === 7 ? nd.nutWidth + 5.1 : nd.nutWidth
  d.neck.taper = n === 7 ? nd.taper + 0.5 : nd.taper
  for (const s of d.pickups) {
    const ok = pickupsFor(s.type, n).some((p) => p.id === s.productId)
    if (!ok) s.productId = defaultPickup(s.type, s.position, n)
  }
  const bridgeOk = bridgesFor(d.hardware.bridge, n).length > 0
  if (!bridgeOk) setBridge(d, 'fixed')
  else setBridge(d, d.hardware.bridge)
  const mode = headstockTemplate(d.headstock.shapeId).shape.tuners.mode
  if (mode !== 'none') {
    const list = tunersFor(mode, n)
    if (!list.some((p) => p.id === d.hardware.tunerProductId)) d.hardware.tunerProductId = list[0]?.id ?? ''
  }
}
