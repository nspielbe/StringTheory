// Core design model. Everything here is plain JSON so designs can be saved,
// exported, and shared by link. All lengths are millimetres.
//
// Coordinate system for the body: x runs across the guitar (bass side is -x
// when you look at the face with the neck pointing up), y runs along the
// strings with the bridge saddle line at y = 0 and the nut at y = scale.

export interface Vec2 {
  x: number
  y: number
}

export interface ShapePoint extends Vec2 {
  /** Sharp corner instead of a smooth curve through this point. */
  corner?: boolean
  /** Neck-pocket corner: x is snapped to the neck width at build time. */
  pocket?: 'L' | 'R'
}

export interface ControlLayout {
  knobs: Vec2[]
  switch: Vec2
  jack: Vec2
  /** Edge jacks: angle (deg) the jack points out of the side. */
  jackAngle: number
}

/** Editable outline. Body shapes are in body space, headstocks in headstock space. */
export interface ShapeData {
  points: ShapePoint[]
}

export interface BodyShapeData extends ShapeData {
  /** y of the body edge where the neck enters. */
  neckPocketY: number
  controls: ControlLayout
  /** Strap button positions. */
  strapButtons: Vec2[]
}

export interface TunerLayout {
  /** Posts are spread evenly along these lines. split = left line for bass strings. */
  mode: 'inline' | 'split' | 'none'
  /** Bass-side line (inline uses only this one). */
  a: [Vec2, Vec2]
  /** Treble-side line (split only). */
  b?: [Vec2, Vec2]
  /** Which side tuner buttons stick out on for inline layouts. */
  side?: 'L' | 'R'
}

export interface HeadstockShapeData extends ShapeData {
  tuners: TunerLayout
}

export type WoodId = string
export type ProductId = string

export type FinishType = 'natural' | 'stain' | 'burst' | 'solid' | 'metallic'
export type Sheen = 'gloss' | 'satin' | 'oil'

export interface Finish {
  type: FinishType
  sheen: Sheen
  /** Stain / paint colour. */
  color: string
  /** Stain strength 0..1 (how much dye soaks in). */
  strength: number
  /** Burst edge colour. */
  burstColor: string
  /** Burst width in mm (how far the dark edge reaches in). */
  burstWidth: number
  /** Vintage amber tint 0..1 in the clear coat. */
  amber: number
}

export type FretWire = 'narrow' | 'medium' | 'jumbo' | 'stainless' | 'gold'
export type NeckProfile = 'C' | 'D' | 'U' | 'V' | 'thinD'
export type Construction = 'bolt-on' | 'set' | 'neck-through'
export type NutMaterial = 'bone' | 'bone-bleached' | 'tusq' | 'tusq-black' | 'black-bone'
export type TrussAccess = 'headstock' | 'spoke' | 'heel'

export type InlayPattern =
  | 'none'
  | 'dots'
  | 'offset-dots'
  | 'blocks'
  | 'trapezoids'
  | 'sharktooth'
  | 'diamonds'
  | 'crescents'
  | 'triangles'
  | 'image'
  | 'spanning-image'

export type InlayMaterial =
  | 'mop'
  | 'abalone'
  | 'gold-mop'
  | 'black-pearl'
  | 'pearloid'
  | 'clay'
  | 'glow'
  | 'color'
  | 'maple'
  | 'ebony'

export interface InlaySettings {
  pattern: InlayPattern
  material: InlayMaterial
  /** Used when material is 'color' or to tint image inlays. */
  color: string
  /** Size multiplier. */
  size: number
  frets: number[]
  doubleAt12: boolean
  /** Image inlay (per-fret or spanning). */
  imageId?: string
  /** Recolour image inlays with the chosen material/colour instead of showing the picture. */
  imageAsMask: boolean
  /** Spanning image: start/end along the fretboard in mm from the nut, plus scale. */
  spanStart: number
  spanLength: number
  /** Stretch a spanning image to spanLength instead of keeping its aspect ratio. */
  spanStretch: boolean
  sideDots: boolean
  sideDotMaterial: 'white' | 'black' | 'glow'
}

export type PickupType = 'humbucker' | 'single' | 'single-hb' | 'p90' | 'tele-bridge'
export type PickupPosition = 'neck' | 'middle' | 'bridge'
export type PickupLayout =
  | 'H' | 'HH' | 'HSS' | 'HSH' | 'SSS' | 'SS' | 'HS' | 'SSH' | 'P90' | 'P90x2' | 'P90x3' | 'T'

export interface PickupSlot {
  position: PickupPosition
  type: PickupType
  productId: ProductId
  /** Cover/bobbin colour. */
  cover: 'black' | 'zebra' | 'nickel' | 'gold' | 'chrome' | 'white' | 'cream' | 'reverse-zebra'
  /** Distance shift along the strings (mm, + toward the neck). */
  offset: number
  /** Slant (deg). */
  slant: number
}

export type SwitchType = 'toggle3' | 'blade5' | 'blade3' | 'superswitch' | 'none'
export type JackType = 'electrosocket' | 'strat-plate' | 'tele-cup' | 'lp-plate'
export type KnobStyle = 'dome' | 'speed' | 'tophat' | 'oring' | 'flat' | 'strat'

export interface Electronics {
  volumes: number
  tones: number
  switchType: SwitchType
  pushPull: boolean
  trebleBleed: boolean
  jack: JackType
  knobStyle: KnobStyle
  shielding: boolean
}

export type HardwareColor = 'chrome' | 'black' | 'gold' | 'nickel' | 'satin'

export type BridgeType =
  | 'hardtail'
  | 'fixed'
  | 'tom'
  | 'vintage-trem'
  | 'two-point-trem'
  | 'floyd'
  | 'tele'
  | 'headless-fixed'
  | 'headless-trem'

export interface Hardware {
  color: HardwareColor
  bridge: BridgeType
  bridgeProductId: ProductId
  tunerProductId: ProductId
  strap: 'buttons' | 'schaller' | 'dunlop'
}

export type PickguardMaterial =
  | 'black' | 'white' | 'cream' | 'bwb' | 'wbw' | 'tortoise' | 'pearloid' | 'clear' | 'mint'

export interface Pickguard {
  enabled: boolean
  shape: ShapeData | null
  material: PickguardMaterial
}

export type DecalZone = 'top' | 'back' | 'headstock' | 'pickguard'
export type DecalMaterial = 'image' | 'color' | 'mop' | 'abalone' | 'gold-leaf' | 'chrome'

export interface Decal {
  id: string
  imageId: string
  name: string
  zone: DecalZone
  visible: boolean
  /** Centre in zone space (mm). */
  x: number
  y: number
  /** Width in mm (height follows the crop aspect). */
  width: number
  rotation: number
  flipX: boolean
  opacity: number
  blend: 'source-over' | 'multiply' | 'screen' | 'overlay' | 'soft-light'
  /** Crop rectangle in normalised image coordinates. */
  crop: { x: number; y: number; w: number; h: number }
  mask: 'none' | 'circle' | 'rounded'
  /** Drop near-white pixels (handy for logos on white backgrounds). */
  removeWhite: number
  hue: number
  saturation: number
  brightness: number
  contrast: number
  grayscale: boolean
  invert: boolean
  /** Fill the image's shape with a material/colour instead of showing the picture. */
  material: DecalMaterial
  color: string
  tintAmount: number
}

export interface TopSettings {
  enabled: boolean
  wood: WoodId
  thickness: number
  carved: boolean
  carveHeight: number
  carveWidth: number
  recurve: number
  /** Leave the top edge undyed so it reads like binding. */
  naturalEdge: boolean
}

export interface BodySettings {
  shapeId: string
  /** Present once the user edits the outline. */
  custom: BodyShapeData | null
  thickness: number
  edgeRadius: number
  backRadius: number
  chamfer: number
  armContour: boolean
  bellyCut: boolean
  wood: WoodId
  pieces: 1 | 2 | 3
  top: TopSettings
  binding: { enabled: boolean; color: string; width: number }
  seed: number
  figure: number
}

export interface NeckSettings {
  construction: Construction
  wood: WoodId
  profile: NeckProfile
  thickness1: number
  thickness12: number
  nutWidth: number
  /** Width added from nut to last fret. */
  taper: number
  radius: number
  radiusEnd: number
  angle: number
  fretWire: FretWire
  truss: TrussAccess
  nut: NutMaterial
  carbonRods: boolean
  fretboardWood: WoodId
  fretboardBinding: { enabled: boolean; color: string }
  seed: number
}

export interface HeadstockSettings {
  shapeId: string
  custom: HeadstockShapeData | null
  /** Tilt-back angle in degrees (0 = flat Fender-style). */
  angle: number
  thickness: number
  reversed: boolean
  /** Separate veneer on the face, or null to show the neck wood. */
  veneer: WoodId | null
  faceFinish: 'match-body' | 'match-top' | 'match-neck' | 'own'
}

export interface Design {
  version: 1
  id: string
  name: string
  author: string
  notes: string
  createdAt: number
  updatedAt: number
  strings: 6 | 7
  scale: number
  frets: 21 | 22 | 24
  leftHanded: boolean
  body: BodySettings
  neck: NeckSettings
  headstock: HeadstockSettings
  inlays: InlaySettings
  finish: {
    top: Finish
    body: Finish
    neck: Finish
    head: Finish
    fretboard: 'oil' | 'clear'
  }
  pickupLayout: PickupLayout
  pickups: PickupSlot[]
  electronics: Electronics
  hardware: Hardware
  pickguard: Pickguard
  decals: Decal[]
  bom: BomSettings
}

export interface BomSettings {
  overrides: Record<string, { price?: number; qty?: number; exclude?: boolean; productId?: string }>
  gbpToUsd: number
  includeFinishing: boolean
  includeStrings: boolean
}
