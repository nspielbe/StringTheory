import type { BridgeType, Design, Finish, PickupLayout, PickupPosition, PickupSlot, PickupType } from '../types'
import { bodyTemplate } from './bodyShapes'
import { headstockTemplate } from './headstockShapes'
import { bridgesFor, tunersFor } from './catalog'
import { uid } from '../lib/geometry'

export const FINISH_NATURAL: Finish = {
  type: 'natural',
  sheen: 'gloss',
  color: '#c0392b',
  strength: 0.65,
  burstColor: '#1d0f06',
  burstWidth: 45,
  amber: 0.12,
}

export const f = (o: Partial<Finish>): Finish => ({ ...FINISH_NATURAL, ...o })

export function slotsFor(layout: PickupLayout, strings: number, modern = false): PickupSlot[] {
  const S = (position: PickupPosition, type: PickupType, slant = 0): PickupSlot => ({
    position,
    type,
    productId: defaultPickup(type, position, strings),
    cover: type === 'humbucker' || modern ? 'black' : type === 'p90' ? 'cream' : 'white',
    offset: 0,
    slant,
  })
  switch (layout) {
    case 'H': return [S('bridge', 'humbucker')]
    case 'HH': return [S('neck', 'humbucker'), S('bridge', 'humbucker')]
    case 'HSS': return [S('neck', 'single'), S('middle', 'single'), S('bridge', 'humbucker')]
    case 'HSH': return [S('neck', 'humbucker'), S('middle', 'single'), S('bridge', 'humbucker')]
    case 'SSS': return [S('neck', 'single'), S('middle', 'single'), S('bridge', 'single', -8)]
    case 'SS': return [S('neck', 'single'), S('bridge', 'single', -6)]
    case 'HS': return [S('neck', 'single'), S('bridge', 'humbucker')]
    case 'SSH': return [S('neck', 'single'), S('middle', 'single'), S('bridge', 'humbucker')]
    case 'P90': return [S('bridge', 'p90')]
    case 'P90x2': return [S('neck', 'p90'), S('bridge', 'p90')]
    case 'P90x3': return [S('neck', 'p90'), S('middle', 'p90'), S('bridge', 'p90')]
    case 'T': return [S('neck', 'single'), S('bridge', 'tele-bridge', -6)]
  }
}

export function defaultPickup(type: PickupType, position: PickupPosition, strings: number): string {
  if (type === 'humbucker') {
    if (strings === 7) return position === 'neck' ? 'sd-sentient' : 'sd-pegasus'
    return position === 'neck' ? 'sd-59' : position === 'middle' ? 'sd-59' : 'sd-jb'
  }
  if (type === 'single') return 'sd-ssl1'
  if (type === 'single-hb') return 'sd-hotrails'
  if (type === 'p90') return 'sd-antiquity-p90'
  return 'sd-broadcaster'
}

export function defaultBridgeProduct(type: BridgeType, strings: number): string {
  return bridgesFor(type, strings)[0]?.id ?? bridgesFor(type, 6)[0]?.id ?? ''
}

export function defaultTuners(headstockId: string, strings: number): string {
  const mode = headstockTemplate(headstockId).shape.tuners.mode
  if (mode === 'none') return ''
  const list = tunersFor(mode, strings)
  return list[0]?.id ?? ''
}

export function makeDesign(templateId = 'prs-style', strings: 6 | 7 = 6): Design {
  const t = bodyTemplate(templateId)
  const d = t.defaults
  const now = Date.now()
  const isMaple = d.construction === 'bolt-on'
  return {
    version: 1,
    id: uid('g'),
    name: 'Untitled guitar',
    author: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    strings,
    scale: d.scale,
    frets: d.frets,
    leftHanded: false,
    body: {
      shapeId: t.id,
      custom: null,
      thickness: d.thickness,
      edgeRadius: d.edgeRadius,
      backRadius: d.backRadius,
      chamfer: d.chamfer,
      armContour: d.armContour,
      bellyCut: d.bellyCut,
      wood: isMaple ? 'alder' : 'african-mahogany',
      pieces: 2,
      top: {
        enabled: d.carved,
        wood: 'flame-maple',
        thickness: d.carved ? 16 : 6,
        carved: d.carved,
        carveHeight: d.carveHeight || 10,
        carveWidth: d.carveWidth,
        recurve: d.recurve,
        naturalEdge: templateId === 'prs-style',
      },
      binding: { enabled: templateId === 'lp-style', color: '#efe6cf', width: 2.2 },
      seed: Math.floor(Math.random() * 1000),
      figure: 0.85,
    },
    neck: {
      construction: d.construction,
      wood: isMaple ? 'hard-maple' : 'african-mahogany',
      profile: 'C',
      thickness1: 21,
      thickness12: 23,
      nutWidth: strings === 7 ? 48 : 42.9,
      taper: strings === 7 ? 14 : 13.5,
      radius: d.construction === 'bolt-on' ? 9.5 : 12,
      radiusEnd: d.construction === 'bolt-on' ? 9.5 : 12,
      angle: d.neckAngle,
      fretWire: 'medium',
      truss: d.headstock === 'fender-6' ? 'heel' : 'headstock',
      nut: 'bone',
      carbonRods: false,
      fretboardWood: isMaple ? 'hard-maple' : 'indian-rosewood',
      fretboardBinding: { enabled: templateId === 'lp-style', color: '#efe6cf' },
      seed: Math.floor(Math.random() * 1000),
    },
    headstock: {
      shapeId: d.headstock,
      custom: null,
      angle: headstockTemplate(d.headstock).angle,
      thickness: 14,
      reversed: false,
      veneer: d.construction === 'bolt-on' ? null : 'ebony',
      faceFinish: d.construction === 'bolt-on' ? 'match-neck' : 'own',
    },
    inlays: {
      pattern: 'dots',
      material: isMaple ? 'black-pearl' : 'mop',
      color: '#f5f0e6',
      size: 1,
      frets: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
      doubleAt12: true,
      imageAsMask: true,
      spanStart: 30,
      spanLength: 380,
      spanStretch: false,
      sideDots: true,
      sideDotMaterial: isMaple ? 'black' : 'white',
    },
    finish: {
      top: f(d.carved ? { type: 'burst', color: '#c98a2b', burstColor: '#3a1a08', strength: 0.7 } : {}),
      body: f(isMaple ? { type: 'burst', color: '#d9a441', burstColor: '#170b05', burstWidth: 55, strength: 0.6 } : { type: 'stain', color: '#5a1c0e', strength: 0.55 }),
      neck: f({ sheen: 'satin', amber: 0.25 }),
      head: f({ type: 'solid', color: '#0d0d0d' }),
      fretboard: 'oil',
    },
    pickupLayout: d.pickups,
    pickups: slotsFor(d.pickups, strings, !['s-style', 't-style', 'offset-style'].includes(templateId)),
    electronics: {
      volumes: d.volumes,
      tones: d.tones,
      switchType: d.switchType,
      pushPull: false,
      trebleBleed: false,
      jack: d.jack,
      knobStyle: d.construction === 'bolt-on' ? 'strat' : 'tophat',
      shielding: true,
    },
    hardware: {
      color: 'chrome',
      bridge: d.bridge,
      bridgeProductId: defaultBridgeProduct(d.bridge, strings),
      tunerProductId: defaultTuners(d.headstock, strings),
      strap: 'buttons',
    },
    pickguard: { enabled: !!d.pickguard, shape: null, material: 'white' },
    decals: [],
    bom: { overrides: {}, gbpToUsd: 1.27, includeFinishing: true, includeStrings: true },
  }
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] }

export function merge<T>(base: T, over: DeepPartial<T>): T {
  const out = structuredClone(base) as Record<string, unknown>
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') out[k] = merge(out[k], v as never)
    else out[k] = v
  }
  return out as T
}

export interface Preset {
  id: string
  name: string
  blurb: string
  make: () => Design
}

export const PRESETS: Preset[] = [
  {
    id: 'carved-dc',
    name: 'Carved double-cut, blue burst',
    blurb: 'PRS-style, quilted maple top, natural edge, HH, fixed bridge',
    make: () =>
      merge(makeDesign('prs-style'), {
        name: 'Ocean Quilt DC',
        body: { top: { wood: 'quilted-maple', naturalEdge: true } },
        finish: {
          top: f({ type: 'burst', color: '#1f6fb5', burstColor: '#061a33', strength: 0.8, burstWidth: 40 }),
          body: f({ type: 'stain', color: '#4a1a0c', strength: 0.5 }),
          head: f({ type: 'natural' }),
        },
        inlays: { pattern: 'crescents', material: 'abalone' },
        hardware: { color: 'nickel' },
      }),
  },
  {
    id: 'classic-s',
    name: 'Classic S, three-tone burst',
    blurb: 'Alder body, maple neck, SSS, vintage tremolo, pickguard',
    make: () =>
      merge(makeDesign('s-style'), {
        name: 'Sunburst S',
        finish: { body: f({ type: 'burst', color: '#e0b04a', burstColor: '#120804', burstWidth: 60, strength: 0.7 }) },
        pickguard: { material: 'tortoise' },
        inlays: { material: 'black-pearl' },
      }),
  },
  {
    id: 'butterscotch-t',
    name: 'Butterscotch T',
    blurb: 'Swamp ash, translucent butterscotch, maple board, T-style bridge',
    make: () =>
      merge(makeDesign('t-style'), {
        name: 'Butterscotch T',
        body: { wood: 'swamp-ash' },
        finish: { body: f({ type: 'stain', color: '#e0a64a', strength: 0.55, amber: 0.3 }) },
        pickguard: { material: 'black' },
      }),
  },
  {
    id: 'cherry-lp',
    name: 'Single-cut cherry burst',
    blurb: 'Mahogany, flame maple carved top, binding, trapezoid inlays',
    make: () =>
      merge(makeDesign('lp-style'), {
        name: 'Cherry Single Cut',
        finish: {
          top: f({ type: 'burst', color: '#e0a23a', burstColor: '#6e0d08', burstWidth: 55, strength: 0.65 }),
          body: f({ type: 'stain', color: '#6e0d08', strength: 0.85 }),
        },
        inlays: { pattern: 'trapezoids', material: 'pearloid' },
        hardware: { color: 'nickel' },
      }),
  },
  {
    id: 'shred-s',
    name: 'Metallic super-S',
    blurb: 'Basswood, metallic paint, HSH, Floyd Rose, sharktooth inlays',
    make: () =>
      merge(makeDesign('superstrat'), {
        name: 'Shred Machine',
        body: { wood: 'basswood' },
        neck: { fretboardWood: 'ebony', radius: 16, radiusEnd: 16, profile: 'thinD', fretWire: 'jumbo' },
        finish: {
          body: f({ type: 'metallic', color: '#7a1fd1' }),
          head: f({ type: 'metallic', color: '#7a1fd1' }),
        },
        headstock: { faceFinish: 'match-body' },
        inlays: { pattern: 'sharktooth', material: 'mop' },
        hardware: { color: 'black' },
      }),
  },
  {
    id: 'headless-7',
    name: 'Headless 7-string',
    blurb: 'Strandberg-style, swamp ash + spalted top, roasted maple neck',
    make: () => {
      const d = makeDesign('headless', 7)
      return merge(d, {
        name: 'Headless Seven',
        body: { wood: 'swamp-ash', top: { enabled: true, wood: 'spalted-tamarind', thickness: 6, carved: false } },
        neck: { wood: 'roasted-maple', fretboardWood: 'roasted-maple', radius: 20, radiusEnd: 20, fretWire: 'stainless' },
        finish: { top: f({ type: 'natural', sheen: 'satin' }), body: f({ type: 'natural', sheen: 'satin' }), neck: f({ sheen: 'oil', amber: 0 }) },
        inlays: { pattern: 'offset-dots', material: 'glow', sideDotMaterial: 'glow' },
        hardware: { color: 'black' },
      })
    },
  },
  {
    id: 'sg-cherry',
    name: 'Twin-horn cherry',
    blurb: 'SG-style mahogany, translucent cherry, block inlays',
    make: () =>
      merge(makeDesign('sg-style'), {
        name: 'Cherry Horns',
        finish: { body: f({ type: 'stain', color: '#8a0f0a', strength: 0.9 }), top: f({ type: 'stain', color: '#8a0f0a', strength: 0.9 }) },
        inlays: { pattern: 'blocks', material: 'pearloid' },
      }),
  },
  {
    id: 'offset-seafoam',
    name: 'Seafoam offset',
    blurb: 'Offset waist, solid seafoam green, P90s, rosewood board',
    make: () => {
      const d = makeDesign('offset-style')
      return merge(d, {
        name: 'Seafoam Offset',
        pickupLayout: 'P90x2',
        pickups: slotsFor('P90x2', 6),
        neck: { fretboardWood: 'indian-rosewood' },
        finish: { body: f({ type: 'solid', color: '#9fd8c3' }) },
        pickguard: { material: 'tortoise' },
        inlays: { material: 'clay' },
      })
    },
  },
  {
    id: 'korina-v',
    name: 'Korina V',
    blurb: 'White limba V-style, natural finish, gold hardware',
    make: () =>
      merge(makeDesign('v-style'), {
        name: 'Korina V',
        body: { wood: 'white-limba' },
        neck: { wood: 'white-limba' },
        finish: { body: f({ type: 'natural', amber: 0.35 }), neck: f({ type: 'natural', amber: 0.35 }) },
        headstock: { veneer: 'ebony' },
        hardware: { color: 'gold' },
      }),
  },
]
