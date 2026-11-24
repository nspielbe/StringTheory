import type { Design, Finish } from '../types'
import { PRODUCTS, VENDORS, type Product } from '../data/catalog'
import { wood } from '../data/woods'
import { GUARDS } from './patterns'
import { fretY } from './geometry'
import { neckWidthAt, resolveBody, resolveHeadstock } from './layout'

// Turns a design into a shopping list: raw wood, components, electronics,
// hardware and finishing supplies, each with a vendor link and price.

export type BomGroup = 'Wood' | 'Neck & fretboard parts' | 'Pickups' | 'Electronics' | 'Hardware' | 'Finishing & supplies'

export const BOM_GROUPS: BomGroup[] = ['Wood', 'Neck & fretboard parts', 'Pickups', 'Electronics', 'Hardware', 'Finishing & supplies']

export interface BomLine {
  key: string
  group: BomGroup
  role: string
  productId?: string
  name: string
  vendor: string
  url?: string
  /** USD per unit after currency conversion. */
  unit: number
  /** Original price + currency. */
  listPrice: number
  currency: 'USD' | 'GBP'
  qty: number
  note?: string
  verified: boolean
  from: boolean
  alternatives: string[]
  excluded: boolean
  overridden: boolean
}

interface Draft {
  key: string
  group: BomGroup
  role: string
  ids: string[]
  qty: number
  note?: string
  custom?: { name: string; price: number; vendor?: string; url?: string }
}

const isStained = (f: Finish) => f.type === 'stain' || f.type === 'burst'
const isClearish = (f: Finish) => f.type !== 'solid' && f.type !== 'metallic'

function fretboardOptions(d: Design): string[] {
  const species = wood(d.neck.fretboardWood).uses.fretboard ?? []
  const slotted: string[] = []
  const s = d.scale
  if (Math.abs(s - 648) < 2) {
    if (d.neck.fretboardWood === 'indian-rosewood') slotted.push('ewz-fb-eir-slotted')
    if (d.neck.fretboardWood === 'pale-moon-ebony') slotted.push('ewz-fb-palemoon-slotted')
    if (d.neck.radius !== d.neck.radiusEnd) slotted.push('sm-fb-fender-compound')
    else if (d.neck.radius < 11) slotted.push('sm-fb-fender-95')
    else slotted.push('sm-fb-fender-12')
  } else if (Math.abs(s - 628) < 3) slotted.push('sm-fb-gibson')
  else if (Math.abs(s - 635) < 2) slotted.push('sm-fb-prs')
  const common = ['indian-rosewood', 'ebony', 'hard-maple', 'pau-ferro', 'roasted-maple'].includes(d.neck.fretboardWood)
  const first = species.filter((id) => slotted.includes(id))
  const rest = species.filter((id) => !slotted.includes(id))
  const ordered = common ? [...first, ...slotted.filter((x) => !first.includes(x)), ...rest] : [...first, ...rest, ...slotted.filter((x) => !first.includes(x))]
  return [...new Set(ordered.length ? ordered : ['sm-fb-unslotted'])]
}

function areaM2(d: Design) {
  const b = resolveBody(d)
  let a = 0
  const o = b.outline
  for (let i = 0; i < o.length; i++) {
    const p = o[i]
    const q = o[(i + 1) % o.length]
    a += p.x * q.y - q.x * p.y
  }
  const face = Math.abs(a / 2) / 1e6
  let per = 0
  for (let i = 0; i < o.length; i++) per += Math.hypot(o[(i + 1) % o.length].x - o[i].x, o[(i + 1) % o.length].y - o[i].y)
  const sides = (per * d.body.thickness) / 1e6
  const neck = 0.035
  const head = 0.012
  return { face, sides, neck, head, total: face * 2 + sides + neck + head }
}

export function buildBom(d: Design): BomLine[] {
  const out: Draft[] = []
  const add = (x: Draft) => out.push(x)
  const body = resolveBody(d)
  const bw = body.bounds.w / 25.4
  const bh = body.bounds.h / 25.4
  const headless = resolveHeadstock(d).mode === 'none'

  // --------------------------------------------------------------- wood
  const bodyIds = wood(d.body.wood).uses.body ?? []
  const oversize = bh > 21.5 || bw > 14.5
  add({
    key: 'body-blank',
    group: 'Wood',
    role: 'Body blank',
    ids: oversize ? ['ewz-mahog-oversize', ...bodyIds] : bodyIds,
    qty: 1,
    note: `Body outline is ${bh.toFixed(1)}" × ${bw.toFixed(1)}" × ${(d.body.thickness / 25.4).toFixed(2)}"` + (oversize ? ' — needs an oversize blank (28" × 18") or a wider glue-up.' : '. Fits a standard 21" × 14" blank.') + (d.neck.construction === 'neck-through' ? ' Neck-through: rip the blank into two wings.' : ''),
  })
  if (d.body.top.enabled) {
    const tops = wood(d.body.top.wood).uses.top ?? []
    const carvedFirst = d.body.top.carved ? [...tops.filter((id) => /carved/i.test(PRODUCTS[id]?.name ?? '')), ...tops.filter((id) => !/carved/i.test(PRODUCTS[id]?.name ?? ''))] : tops
    add({ key: 'top', group: 'Wood', role: d.body.top.carved ? 'Carved top (bookmatched)' : 'Drop top (bookmatched)', ids: carvedFirst, qty: 1, note: d.body.top.carved ? `Carved cap: needs ≥ ${(d.body.top.thickness / 25.4).toFixed(2)}" thick halves.` : `Drop top ${(d.body.top.thickness / 25.4).toFixed(2)}" thick.` })
  }
  const neckIds = wood(d.neck.wood).uses.neck ?? ['sm-maple-neck']
  const angled = d.headstock.angle > 0
  add({
    key: 'neck-blank',
    group: 'Wood',
    role: 'Neck blank',
    ids: neckIds,
    qty: d.neck.construction === 'neck-through' ? 2 : 1,
    note: (d.neck.construction === 'neck-through' ? 'Neck-through needs a ~36" blank (or laminate two blanks). ' : '') + (angled ? `Angled headstock (${d.headstock.angle}°): use a scarf joint or a thicker blank.` : '') || undefined,
  })
  add({
    key: 'fretboard',
    group: 'Wood',
    role: 'Fretboard blank',
    ids: fretboardOptions(d),
    qty: 1,
    note: `${wood(d.neck.fretboardWood).name}, ${(d.scale / 25.4).toFixed(2)}" scale, ${d.frets} frets` + (d.frets === 24 ? ' (slotted boards are usually 22 frets — extend slots or buy unslotted).' : '.'),
  })
  if (d.headstock.veneer && !headless) {
    const hp = wood(d.headstock.veneer).uses.headplate ?? ['sm-headplate']
    add({ key: 'headplate', group: 'Wood', role: 'Headstock veneer', ids: hp, qty: 1, note: wood(d.headstock.veneer).name })
  }

  // --------------------------------------------------------------- neck parts
  const fretIds = { narrow: 'sm-fret-narrow', medium: 'sm-fret-medium', jumbo: 'sm-fret-wide', stainless: 'sm-fret-ss', gold: 'sm-fret-gold' }
  let fretLen = 0
  for (let n = 1; n <= d.frets; n++) fretLen += neckWidthAt(d, fretY(d.scale, n)) + 4
  const pieces = Math.ceil((fretLen * 1.15) / 609.6)
  add({ key: 'frets', group: 'Neck & fretboard parts', role: 'Fret wire', ids: [fretIds[d.neck.fretWire], 'sm-fret-medium', 'sm-fret-wide', 'sm-fret-ss'], qty: pieces, note: `${d.frets} frets ≈ ${(fretLen / 25.4).toFixed(0)}" of wire + 15% waste` })
  add({ key: 'truss', group: 'Neck & fretboard parts', role: 'Truss rod', ids: d.neck.truss === 'spoke' ? ['sm-truss-spoke', 'sm-truss-lowpro'] : ['sm-truss-lowpro', 'sm-truss-allen', 'sm-truss-spoke'], qty: 1, note: d.neck.truss === 'heel' ? 'Adjust at the heel' : d.neck.truss === 'spoke' ? 'Spoke-wheel adjust at the heel' : 'Adjust at the headstock' })
  if (d.neck.carbonRods) add({ key: 'carbon', group: 'Neck & fretboard parts', role: 'Carbon fibre rods', ids: ['sm-carbon-rods'], qty: 2 })
  if (d.hardware.bridge === 'floyd') {
    const orig = d.hardware.bridgeProductId.startsWith('fr-original')
    add({ key: 'nut', group: 'Neck & fretboard parts', role: 'Locking nut', ids: d.strings === 7 ? ['fr-nut-7'] : orig ? ['fr-nut-original', 'fr-nut-1000'] : ['fr-nut-1000', 'fr-nut-original'], qty: 1, note: orig ? 'Original systems usually include a nut — exclude this if yours does.' : undefined })
  } else if (!headless) {
    const nutIds: Record<string, string> = { bone: 'sm-nut-bone', 'bone-bleached': 'sm-nut-bone-bleached', tusq: 'sm-nut-tusq', 'tusq-black': 'sm-nut-tusq-black', 'black-bone': 'sm-nut-blackbone' }
    add({ key: 'nut', group: 'Neck & fretboard parts', role: 'Nut', ids: [nutIds[d.neck.nut], 'sm-nut-bone', 'sm-nut-tusq'], qty: 1 })
  }
  const inl = d.inlays
  const marks = inl.frets.filter((n) => n <= d.frets)
  const count = marks.length + (inl.doubleAt12 ? marks.filter((n) => n === 12 || n === 24).length : 0)
  if (inl.pattern === 'dots' || inl.pattern === 'offset-dots') {
    const dotIds: Record<string, string> = { mop: 'sm-dot-pearl', abalone: 'sm-dot-abalone', 'gold-mop': 'sm-dot-goldpearl', 'black-pearl': 'sm-dot-black', ebony: 'sm-dot-black', clay: 'sm-dot-clay', pearloid: 'sm-dot-pearloid', maple: 'sm-dot-pearloid' }
    if (inl.material === 'glow' || inl.material === 'color') add({ key: 'inlays', group: 'Neck & fretboard parts', role: 'Inlay dots', ids: [], qty: count, custom: { name: inl.material === 'glow' ? 'Glow (luminlay) dots, 1/4"' : 'Coloured acrylic dots, 1/4"', price: 1.5 }, note: 'Not sold by the listed vendors — price estimated' })
    else add({ key: 'inlays', group: 'Neck & fretboard parts', role: 'Inlay dots', ids: [dotIds[inl.material] ?? 'sm-dot-pearl', 'sm-dot-pearl', 'sm-dot-abalone'], qty: count })
  } else if (inl.pattern === 'diamonds') {
    add({ key: 'inlays', group: 'Neck & fretboard parts', role: 'Diamond inlays', ids: inl.material === 'abalone' ? ['sm-diamond-abalone', 'sm-diamond-pearl'] : ['sm-diamond-pearl', 'sm-diamond-abalone'], qty: count })
  } else if (inl.pattern !== 'none') {
    const per = inl.pattern === 'spanning-image' ? 0 : inl.pattern === 'sharktooth' || inl.pattern === 'blocks' ? 0.6 : 0.4
    const blanks = inl.pattern === 'spanning-image' ? 6 : Math.max(1, Math.ceil(count * per))
    add({ key: 'inlays', group: 'Neck & fretboard parts', role: 'Inlay material (cut to shape)', ids: ['sm-pearl-blank', 'sm-abalone-purfling'], qty: blanks, note: `${count} ${inl.pattern.replace('-', ' ')} inlays — cut from pearl blanks (${inl.material} look)` })
  }
  if (inl.sideDots) {
    if (inl.sideDotMaterial === 'white') add({ key: 'sidedots', group: 'Neck & fretboard parts', role: 'Side dots', ids: ['sm-sidedots-pearl', 'sm-sidedots-pearloid'], qty: 1 })
    else add({ key: 'sidedots', group: 'Neck & fretboard parts', role: 'Side dots', ids: [], qty: 1, custom: { name: inl.sideDotMaterial === 'glow' ? 'Glow side dot rod (luminlay)' : 'Black side dot rod', price: 6 }, note: 'Price estimated' })
  }
  if (d.neck.fretboardBinding.enabled) add({ key: 'fbbinding', group: 'Neck & fretboard parts', role: 'Fretboard binding', ids: [], qty: 1, custom: { name: 'Fretboard binding strips (pair)', price: 9, vendor: 'StewMac', url: 'https://www.stewmac.com/search/?q=binding' }, note: 'Price estimated' })
  if (d.body.binding.enabled) add({ key: 'binding', group: 'Neck & fretboard parts', role: 'Body binding', ids: [], qty: 1, custom: { name: 'Body binding strip (5 ft)', price: 12, vendor: 'StewMac', url: 'https://www.stewmac.com/search/?q=binding' }, note: 'Price estimated' })

  // --------------------------------------------------------------- pickups
  const used = new Map<string, { slots: string[] }>()
  for (const s of d.pickups) {
    const e = used.get(s.productId) ?? { slots: [] }
    e.slots.push(s.position)
    used.set(s.productId, e)
  }
  for (const [id, e] of used) {
    const p = PRODUCTS[id]
    const set = p?.pickup?.set ?? 1
    add({ key: 'pickup-' + id, group: 'Pickups', role: e.slots.join(' + ') + ' pickup' + (e.slots.length > 1 ? 's' : ''), ids: [id], qty: Math.ceil(e.slots.length / set), note: d.strings === 7 ? 'Order the 7-string version.' : undefined })
  }
  const hb = d.pickups.filter((s) => s.type === 'humbucker').length
  if (hb && !d.pickguard.enabled) add({ key: 'rings', group: 'Pickups', role: 'Pickup rings', ids: ['sm-hb-rings'], qty: hb })

  // --------------------------------------------------------------- electronics
  const knobs = d.electronics.volumes + d.electronics.tones
  const singles = d.pickups.every((s) => s.type === 'single' || s.type === 'tele-bridge')
  if (d.electronics.pushPull) add({ key: 'pushpull', group: 'Electronics', role: 'Push-pull pot', ids: ['sm-pot-pushpull'], qty: 1, note: 'Coil split / series switching' })
  const plain = knobs - (d.electronics.pushPull ? 1 : 0)
  if (plain > 0) add({ key: 'pots', group: 'Electronics', role: 'Pots', ids: ['sm-pot-cts'], qty: plain, note: singles ? 'Choose 250k (single coils)' : 'Choose 500k (humbuckers)' })
  const sw: Record<string, string> = { toggle3: 'sm-sw-toggle', blade5: 'sm-sw-5way', blade3: 'sm-sw-3way-blade', superswitch: 'sm-sw-super' }
  if (d.electronics.switchType !== 'none') add({ key: 'switch', group: 'Electronics', role: 'Pickup selector', ids: [sw[d.electronics.switchType], 'sm-sw-5way', 'sm-sw-super'], qty: 1 })
  add({ key: 'jack', group: 'Electronics', role: 'Output jack', ids: ['sm-jack'], qty: 1 })
  if (d.electronics.tones > 0) add({ key: 'cap', group: 'Electronics', role: 'Tone capacitor', ids: ['sm-cap-od'], qty: 1 })
  if (d.electronics.trebleBleed) add({ key: 'tb', group: 'Electronics', role: 'Treble bleed', ids: ['sm-treble-bleed'], qty: d.electronics.volumes })
  add({ key: 'wire', group: 'Electronics', role: 'Hook-up wire', ids: ['sm-wire'], qty: 1 })
  add({ key: 'wire2', group: 'Electronics', role: 'Shielded jack wire', ids: ['sm-wire-shielded'], qty: 1 })
  if (d.electronics.shielding) {
    add({ key: 'shield', group: 'Electronics', role: 'Cavity shielding', ids: ['sm-copper-tape'], qty: 1 })
    if (d.pickguard.enabled) add({ key: 'pgshield', group: 'Electronics', role: 'Pickguard shielding', ids: ['sm-pg-shield'], qty: 1 })
  }
  if (d.pickups.some((s) => PRODUCTS[s.productId]?.pickup?.output === 'active')) add({ key: 'battery', group: 'Electronics', role: 'Battery box', ids: [], qty: 1, custom: { name: '9V battery box (for active pickups)', price: 8, vendor: 'StewMac', url: 'https://www.stewmac.com/search/?q=battery+box' }, note: 'Price estimated' })

  // --------------------------------------------------------------- hardware
  add({ key: 'bridge', group: 'Hardware', role: 'Bridge', ids: [d.hardware.bridgeProductId].filter(Boolean), qty: 1, note: d.hardware.bridge === 'floyd' ? 'Needs a recessed route; locking nut listed above.' : undefined })
  if (d.hardware.bridge === 'hardtail') add({ key: 'ferrules', group: 'Hardware', role: 'String-through ferrules', ids: ['hs-ferrule'], qty: d.strings })
  if (!headless && d.hardware.tunerProductId) {
    const t = PRODUCTS[d.hardware.tunerProductId]
    add({ key: 'tuners', group: 'Hardware', role: 'Tuners', ids: [d.hardware.tunerProductId], qty: t?.tuners?.layout === 'single' ? d.strings : 1 })
  }
  const knobIds: Record<string, string> = { dome: 'sm-knob-dome', speed: 'sm-knob-speed', tophat: 'sm-knob-tophat', oring: 'hs-knob-oring', flat: 'sm-knob-flat', strat: 'sm-knob-strat' }
  add({ key: 'knobs', group: 'Hardware', role: 'Knobs', ids: [knobIds[d.electronics.knobStyle]], qty: Math.min(4, knobs) })
  if (d.electronics.switchType === 'toggle3') {
    add({ key: 'toggletip', group: 'Hardware', role: 'Toggle tip', ids: ['sm-toggle-tip'], qty: 1 })
    add({ key: 'toggleplate', group: 'Hardware', role: 'Toggle washer plate', ids: ['sm-toggle-plate'], qty: 1 })
  }
  const jackIds: Record<string, string> = { electrosocket: 'sm-electrosocket', 'strat-plate': 'sm-jackplate-strat', 'tele-cup': 'sm-jackcup-tele', 'lp-plate': 'sm-jackplate-lp' }
  add({ key: 'jackmount', group: 'Hardware', role: 'Jack mount', ids: [jackIds[d.electronics.jack]], qty: 1 })
  if (d.hardware.strap === 'buttons') add({ key: 'strap', group: 'Hardware', role: 'Strap buttons', ids: ['sm-strap-gotoh'], qty: 2, note: 'Price shown each' })
  else add({ key: 'strap', group: 'Hardware', role: 'Strap locks', ids: [d.hardware.strap === 'schaller' ? 'sm-strap-schaller' : 'sm-strap-dunlop'], qty: 1 })
  if (d.neck.construction === 'bolt-on') add({ key: 'neckplate', group: 'Hardware', role: 'Neck plate & screws', ids: ['sm-neckplate'], qty: 1 })
  const trem = ['vintage-trem', 'two-point-trem', 'floyd'].includes(d.hardware.bridge)
  if (!d.pickguard.enabled || trem || d.neck.truss === 'headstock')
    add({ key: 'covers', group: 'Hardware', role: 'Cover plate stock', ids: ['sm-cavity-cover', 'sm-truss-cover'], qty: 1, note: [!d.pickguard.enabled && 'control cavity cover', trem && 'tremolo cavity cover', d.neck.truss === 'headstock' && 'truss rod cover'].filter(Boolean).join(', ') })
  if (d.pickguard.enabled) add({ key: 'pickguard', group: 'Hardware', role: 'Pickguard material', ids: [GUARDS[d.pickguard.material].productId], qty: 1, note: GUARDS[d.pickguard.material].label })

  // --------------------------------------------------------------- finishing
  if (d.bom.includeFinishing) {
    const a = areaM2(d)
    const zones: { name: string; f: Finish; woodId: string; area: number }[] = [
      { name: 'top', f: d.body.top.enabled ? d.finish.top : d.finish.body, woodId: d.body.top.enabled ? d.body.top.wood : d.body.wood, area: a.face },
      { name: 'body', f: d.finish.body, woodId: d.body.wood, area: a.face + a.sides },
      { name: 'neck', f: d.finish.neck, woodId: d.neck.wood, area: a.neck },
    ]
    if (d.headstock.faceFinish === 'own' && !headless) zones.push({ name: 'headstock', f: d.finish.head, woodId: d.headstock.veneer ?? d.neck.wood, area: a.head })
    const lacquerZones = zones.filter((z) => z.f.sheen !== 'oil')
    const lacquerArea = lacquerZones.reduce((s, z) => s + z.area, 0)
    add({ key: 'sand', group: 'Finishing & supplies', role: 'Sandpaper', ids: ['sm-sandpaper'], qty: 6, note: 'One sheet each of 120, 180, 220, 320, 400, 600' })
    add({ key: 'tape', group: 'Finishing & supplies', role: 'Masking tape', ids: ['sm-tape'], qty: 1 })
    add({ key: 'woodglue', group: 'Finishing & supplies', role: 'Wood glue', ids: ['sm-woodglue'], qty: 1 })
    add({ key: 'superglue', group: 'Finishing & supplies', role: 'Super glue', ids: ['sm-superglue'], qty: 1 })
    const needsFiller = lacquerZones.some((z) => isClearish(z.f) && wood(z.woodId).openGrain)
    if (needsFiller) add({ key: 'filler', group: 'Finishing & supplies', role: 'Grain filler', ids: ['sm-grainfiller'], qty: 1, note: 'Open-pore wood under a lacquer finish' })
    const stainColors = [...new Set(zones.filter((z) => isStained(z.f)).map((z) => z.f.color.toLowerCase()))]
    if (stainColors.length) add({ key: 'stain', group: 'Finishing & supplies', role: 'Wood dye', ids: ['sm-stain'], qty: stainColors.length, note: 'Colours: ' + stainColors.join(', ') + ' — pick the closest ColorTone shade' })
    const bursts = zones.filter((z) => z.f.type === 'burst')
    for (const z of bursts) {
      const red = parseInt(z.f.burstColor.slice(1, 3), 16) > parseInt(z.f.burstColor.slice(3, 5), 16) * 2
      add({ key: 'burst-' + z.name, group: 'Finishing & supplies', role: `Burst toner (${z.name})`, ids: red ? ['sm-lacquer-cherry', 'sm-lacquer-tobacco'] : ['sm-lacquer-tobacco', 'sm-lacquer-cherry'], qty: 1 })
    }
    const solids = zones.filter((z) => !isClearish(z.f))
    const solidColors = new Map<string, number>()
    for (const z of solids) solidColors.set(z.f.color.toLowerCase() + z.f.type, (solidColors.get(z.f.color.toLowerCase() + z.f.type) ?? 0) + z.area)
    let ci = 0
    for (const [k, ar] of solidColors) {
      add({ key: 'paint-' + ci++, group: 'Finishing & supplies', role: 'Colour coat', ids: ['sm-lacquer-color'], qty: Math.max(1, Math.ceil(ar * 7)), note: `${k.slice(0, 7)} ${k.includes('metallic') ? '(metallic)' : ''}` })
    }
    if (solids.length) add({ key: 'primer', group: 'Finishing & supplies', role: 'Primer', ids: ['sm-primer'], qty: 1 })
    if (lacquerZones.length) {
      add({ key: 'sealer', group: 'Finishing & supplies', role: 'Sanding sealer', ids: ['sm-sealer'], qty: Math.max(1, Math.ceil(lacquerArea * 5)) })
      const amber = lacquerZones.some((z) => z.f.amber > 0.25)
      const satin = lacquerZones.every((z) => z.f.sheen === 'satin')
      add({ key: 'clear', group: 'Finishing & supplies', role: 'Clear coat', ids: amber ? ['sm-lacquer-aged', 'sm-lacquer-clear'] : ['sm-lacquer-clear', 'sm-lacquer-aged'], qty: Math.max(2, Math.ceil(lacquerArea * 12)), note: satin ? 'Choose satin sheen' : 'Gloss — ~10 coats' })
      if (amber && !lacquerZones.every((z) => z.f.amber > 0.25)) add({ key: 'amber', group: 'Finishing & supplies', role: 'Amber toner', ids: ['sm-lacquer-amber'], qty: 1 })
      if (lacquerZones.some((z) => z.f.sheen === 'gloss')) {
        add({ key: 'polish', group: 'Finishing & supplies', role: 'Polishing compound', ids: ['sm-polish'], qty: 1 })
        add({ key: 'micromesh', group: 'Finishing & supplies', role: 'Micro-mesh pads', ids: ['sm-micromesh'], qty: 1 })
      }
    }
    if (zones.some((z) => z.f.sheen === 'oil')) add({ key: 'oil', group: 'Finishing & supplies', role: 'Oil / wipe-on finish', ids: ['sm-wipeon-poly'], qty: 1, note: 'Zones: ' + zones.filter((z) => z.f.sheen === 'oil').map((z) => z.name).join(', ') })
    if (d.finish.fretboard === 'oil') add({ key: 'fboil', group: 'Finishing & supplies', role: 'Fretboard oil', ids: ['sm-fb-oil'], qty: 1 })
    if (d.decals.length) add({ key: 'decal', group: 'Finishing & supplies', role: 'Decal paper', ids: ['sm-decal-paper'], qty: 1, note: `${d.decals.length} graphic${d.decals.length > 1 ? 's' : ''} (or have them printed as waterslide decals)` })
  }
  if (d.bom.includeStrings) add({ key: 'strings', group: 'Finishing & supplies', role: 'Strings', ids: ['sm-strings'], qty: 1, note: d.strings === 7 ? '7-string set' : undefined })

  // --------------------------------------------------------------- resolve
  return out.map((x) => resolveLine(x, d))
}

function resolveLine(x: Draft, d: Design): BomLine {
  const ov = d.bom.overrides[x.key] ?? {}
  const ids = [...new Set(x.ids)].filter((id) => PRODUCTS[id])
  const chosen = ov.productId && PRODUCTS[ov.productId] ? ov.productId : ids[0]
  const p: Product | undefined = chosen ? PRODUCTS[chosen] : undefined
  if (!p) {
    const c = x.custom ?? { name: x.role, price: 0 }
    const unit = ov.price ?? c.price
    return {
      key: x.key, group: x.group, role: x.role, name: c.name, vendor: c.vendor ?? 'Other', url: c.url, unit, listPrice: c.price, currency: 'USD',
      qty: ov.qty ?? x.qty, note: x.note, verified: false, from: false, alternatives: [], excluded: !!ov.exclude, overridden: ov.price !== undefined || ov.qty !== undefined,
    }
  }
  const v = VENDORS[p.vendor]
  const rate = v.currency === 'GBP' ? d.bom.gbpToUsd : 1
  return {
    key: x.key,
    group: x.group,
    role: x.role,
    productId: p.id,
    name: p.name,
    vendor: v.name,
    url: p.url,
    unit: ov.price ?? +(p.price * rate).toFixed(2),
    listPrice: p.price,
    currency: v.currency,
    qty: ov.qty ?? x.qty,
    note: [x.note, p.note].filter(Boolean).join(' · ') || undefined,
    verified: p.verified,
    from: !!p.from,
    alternatives: ids.filter((id) => id !== p.id),
    excluded: !!ov.exclude,
    overridden: ov.price !== undefined || ov.qty !== undefined,
  }
}

export interface BomTotals {
  total: number
  byGroup: Record<BomGroup, number>
  estimated: number
  lines: number
}

export function bomTotals(lines: BomLine[]): BomTotals {
  const byGroup = Object.fromEntries(BOM_GROUPS.map((g) => [g, 0])) as Record<BomGroup, number>
  let total = 0
  let estimated = 0
  let n = 0
  for (const l of lines) {
    if (l.excluded) continue
    const v = l.unit * l.qty
    byGroup[l.group] += v
    total += v
    n++
    if (!l.verified) estimated += v
  }
  return { total, byGroup, estimated, lines: n }
}

export function bomCsv(d: Design, lines: BomLine[]): string {
  const esc = (s: string | number | undefined) => `"${String(s ?? '').replace(/"/g, '""')}"`
  const rows = [['Group', 'Part', 'Item', 'Vendor', 'Qty', 'Unit (USD)', 'Subtotal (USD)', 'List price', 'Price status', 'Link', 'Notes'].map(esc).join(',')]
  for (const l of lines) {
    if (l.excluded) continue
    rows.push([l.group, l.role, l.name, l.vendor, l.qty, l.unit.toFixed(2), (l.unit * l.qty).toFixed(2), `${l.currency} ${l.listPrice.toFixed(2)}${l.from ? ' (from)' : ''}`, l.verified ? 'listed' : 'estimate', l.url, l.note].map(esc).join(','))
  }
  const t = bomTotals(lines)
  rows.push(['', '', 'TOTAL', '', '', '', t.total.toFixed(2), '', '', '', `${d.name}`].map(esc).join(','))
  return rows.join('\n')
}

export function formatUsd(v: number) {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/** Rough finished weight from body volume and species densities. */
export function weightEstimate(d: Design, volumeMm3: number): number {
  const bodyKg = (volumeMm3 / 1e9) * wood(d.body.wood).density * 0.9
  const topKg = d.body.top.enabled ? ((volumeMm3 / 1e9) * (d.body.top.thickness / d.body.thickness) * (wood(d.body.top.wood).density - wood(d.body.wood).density)) * 0.9 : 0
  const neckKg = 0.42 * (wood(d.neck.wood).density / 700) + 0.12 * (wood(d.neck.fretboardWood).density / 800)
  const hardware = 0.55 + d.pickups.length * 0.09 + (d.hardware.bridge === 'floyd' ? 0.35 : 0)
  return bodyKg + topKg + neckKg + hardware
}
