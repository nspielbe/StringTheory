import type { BodyShapeData, BridgeType, Construction, PickupLayout, ShapePoint, SwitchType, JackType } from '../types'

// Generic body outlines, drawn in mm with the bridge saddle line at y = 0,
// the strings along +y and the bass side at -x. They're "in the style of"
// common guitars, not copies of any one instrument. Points marked `pocket`
// snap to the neck width; `corner` points stay sharp.

export interface BodyTemplate {
  id: string
  name: string
  family: string
  shape: BodyShapeData
  defaults: {
    scale: number
    frets: 21 | 22 | 24
    thickness: number
    edgeRadius: number
    backRadius: number
    chamfer: number
    armContour: boolean
    bellyCut: boolean
    carved: boolean
    carveHeight: number
    carveWidth: number
    recurve: number
    construction: Construction
    headstock: string
    bridge: BridgeType
    pickups: PickupLayout
    switchType: SwitchType
    jack: JackType
    volumes: number
    tones: number
    pickguard: string | null
    neckAngle: number
  }
}

const P = (x: number, y: number, o: Partial<ShapePoint> = {}): ShapePoint => ({ x, y, ...o })
const pts = (arr: [number, number, (0 | 1)?][]): ShapePoint[] =>
  arr.map(([x, y, c]) => (c ? P(x, y, { corner: true }) : P(x, y)))

export const BODY_TEMPLATES: BodyTemplate[] = [
  {
    id: 's-style',
    name: 'Fender-style S (double cut, contoured)',
    family: 'Bolt-on',
    shape: {
      points: [
        P(-28, 257, { corner: true, pocket: 'L' }),
        ...pts([[-38, 259], [-47, 266], [-53, 280], [-57, 297], [-62, 312], [-71, 322], [-83, 324], [-93, 317], [-99, 302], [-102, 283], [-106, 262], [-115, 240], [-129, 218], [-141, 196], [-146, 172], [-140, 146], [-127, 121], [-120, 96], [-124, 71], [-138, 44], [-155, 16], [-163, -12], [-160, -42], [-144, -68], [-114, -86], [-62, -96], [0, -99], [62, -96], [114, -86], [144, -68], [160, -42], [163, -12], [155, 16], [138, 44], [126, 71], [122, 96], [127, 121], [136, 146], [138, 172], [130, 196], [115, 216], [102, 236], [95, 257], [88, 276], [79, 289], [68, 293], [58, 288], [50, 278], [43, 265], [36, 258]]),
        P(28, 257, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 257,
      controls: { knobs: [{ x: 70, y: 24 }, { x: 87, y: -8 }, { x: 101, y: -40 }, { x: 113, y: -70 }], switch: { x: 66, y: 66 }, jack: { x: 128, y: -64 }, jackAngle: 35 },
      strapButtons: [{ x: 0, y: -98 }, { x: -67, y: 315 }],
    },
    defaults: { scale: 648, frets: 22, thickness: 44.5, edgeRadius: 6.5, backRadius: 6.5, chamfer: 0, armContour: true, bellyCut: true, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'fender-6', bridge: 'vintage-trem', pickups: 'SSS', switchType: 'blade5', jack: 'strat-plate', volumes: 1, tones: 2, pickguard: 's-guard', neckAngle: 0 },
  },
  {
    id: 't-style',
    name: 'Fender-style T (single cut slab)',
    family: 'Bolt-on',
    shape: {
      points: [
        P(-28, 257, { corner: true, pocket: 'L' }),
        ...pts([[-36, 266], [-60, 272], [-92, 268], [-120, 252], [-140, 226], [-150, 192], [-148, 158], [-136, 126], [-131, 100], [-140, 66], [-155, 32], [-162, -4], [-158, -44], [-140, -74], [-104, -94], [-52, -102], [0, -104], [52, -102], [104, -94], [140, -74], [158, -44], [162, -4], [155, 32], [140, 66], [131, 100], [134, 130], [142, 160], [146, 186], [140, 206], [124, 218], [100, 222], [74, 224], [52, 230], [36, 243]]),
        P(28, 257, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 257,
      controls: { knobs: [{ x: 112, y: 6 }, { x: 118, y: -28 }, { x: 122, y: -60 }, { x: 96, y: -60 }], switch: { x: 104, y: 42 }, jack: { x: 159, y: -30 }, jackAngle: 0 },
      strapButtons: [{ x: 0, y: -104 }, { x: -95, y: 268 }],
    },
    defaults: { scale: 648, frets: 22, thickness: 44.5, edgeRadius: 2, backRadius: 2, chamfer: 0, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'fender-6', bridge: 'tele', pickups: 'T', switchType: 'blade3', jack: 'tele-cup', volumes: 1, tones: 1, pickguard: 't-guard', neckAngle: 0 },
  },
  {
    id: 'lp-style',
    name: 'Gibson-style LP (single cut, carved top)',
    family: 'Set neck',
    shape: {
      points: [
        P(-28, 264, { corner: true, pocket: 'L' }),
        ...pts([[-36, 276], [-52, 288], [-76, 294], [-102, 290], [-124, 276], [-140, 254], [-148, 226], [-146, 196], [-136, 166], [-122, 140], [-117, 116], [-124, 90], [-142, 58], [-158, 24], [-165, -12], [-162, -50], [-148, -86], [-122, -116], [-84, -138], [-42, -149], [0, -152], [42, -149], [84, -138], [122, -116], [148, -86], [162, -50], [165, -12], [158, 24], [142, 58], [124, 88], [116, 114], [118, 142], [121, 170], [116, 198], [104, 222], [88, 242], [74, 254], [62, 256], [50, 248], [40, 234], [33, 220]]),
        P(28, 207, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 264,
      controls: { knobs: [{ x: 78, y: -48 }, { x: 120, y: -36 }, { x: 92, y: -92 }, { x: 132, y: -80 }], switch: { x: -96, y: 222 }, jack: { x: 158, y: -62 }, jackAngle: -20 },
      strapButtons: [{ x: 0, y: -151 }, { x: -62, y: 288 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 44, edgeRadius: 2, backRadius: 2, chamfer: 0, armContour: false, bellyCut: false, carved: true, carveHeight: 13, carveWidth: 48, recurve: 0.35, construction: 'set', headstock: 'gibson-33', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'lp-plate', volumes: 2, tones: 2, pickguard: null, neckAngle: 4 },
  },
  {
    id: 'prs-style',
    name: 'PRS-style double cut (carved top)',
    family: 'Set neck',
    shape: {
      points: [
        P(-28, 205, { corner: true, pocket: 'L' }),
        ...pts([[-38, 207], [-48, 214], [-55, 228], [-60, 246], [-66, 262], [-76, 274], [-89, 276], [-100, 267], [-106, 250], [-109, 230], [-114, 208], [-125, 188], [-140, 166], [-150, 140], [-150, 112], [-141, 88], [-138, 62], [-148, 34], [-160, 4], [-165, -30], [-158, -64], [-138, -94], [-100, -114], [-50, -123], [0, -125], [50, -123], [100, -114], [138, -94], [158, -64], [165, -30], [160, 4], [148, 34], [138, 62], [140, 88], [146, 114], [144, 140], [132, 162], [116, 180], [104, 200], [98, 222], [90, 238], [80, 248], [68, 250], [58, 242], [50, 228], [43, 214], [35, 205]]),
        P(28, 200, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 205,
      controls: { knobs: [{ x: 78, y: -34 }, { x: 104, y: -62 }, { x: 124, y: -88 }, { x: 60, y: -62 }], switch: { x: 110, y: -6 }, jack: { x: 160, y: -48 }, jackAngle: -12 },
      strapButtons: [{ x: 0, y: -122 }, { x: -74, y: 272 }],
    },
    defaults: { scale: 635, frets: 24, thickness: 46, edgeRadius: 2.5, backRadius: 3, chamfer: 0, armContour: false, bellyCut: false, carved: true, carveHeight: 10, carveWidth: 36, recurve: 0.15, construction: 'set', headstock: 'prs-33', bridge: 'fixed', pickups: 'HH', switchType: 'blade5', jack: 'electrosocket', volumes: 1, tones: 1, pickguard: null, neckAngle: 3 },
  },
  {
    id: 'sg-style',
    name: 'Gibson-style SG (twin horns, bevelled)',
    family: 'Set neck',
    shape: {
      points: [
        P(-28, 188, { corner: true, pocket: 'L' }),
        ...pts([[-40, 192], [-52, 204], [-62, 222], [-72, 244], [-82, 263], [-91, 276], [-101, 275], [-107, 260], [-111, 238], [-117, 213], [-128, 188], [-139, 160], [-143, 132], [-138, 104], [-136, 76], [-148, 46], [-160, 10], [-164, -26], [-158, -62], [-138, -94], [-100, -118], [-50, -130], [0, -132], [50, -130], [100, -118], [138, -94], [158, -62], [164, -26], [160, 10], [148, 46], [136, 76], [138, 104], [143, 132], [138, 160], [127, 184], [115, 206], [106, 228], [98, 247], [90, 259], [80, 260], [70, 248], [58, 228], [46, 208], [36, 192]]),
        P(28, 186, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 188,
      controls: { knobs: [{ x: 66, y: -52 }, { x: 102, y: -42 }, { x: 80, y: -90 }, { x: 116, y: -80 }], switch: { x: 112, y: 112 }, jack: { x: 150, y: -84 }, jackAngle: -30 },
      strapButtons: [{ x: 0, y: -130 }, { x: -78, y: 270 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 35, edgeRadius: 1.5, backRadius: 1.5, chamfer: 9, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'set', headstock: 'gibson-33', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'electrosocket', volumes: 2, tones: 2, pickguard: null, neckAngle: 3 },
  },
  {
    id: 'offset-style',
    name: 'Fender-style offset (JM / JG)',
    family: 'Bolt-on',
    shape: {
      points: [
        P(-28, 257, { corner: true, pocket: 'L' }),
        ...pts([[-38, 260], [-48, 270], [-55, 286], [-60, 304], [-67, 318], [-79, 326], [-92, 324], [-101, 312], [-105, 292], [-109, 268], [-120, 242], [-138, 214], [-154, 186], [-159, 154], [-152, 122], [-139, 94], [-140, 62], [-156, 24], [-168, -16], [-170, -58], [-156, -96], [-122, -118], [-74, -124], [-26, -116], [22, -106], [70, -98], [112, -88], [146, -66], [163, -32], [164, 6], [150, 40], [134, 70], [132, 100], [144, 132], [152, 162], [146, 190], [126, 210], [106, 228], [94, 250], [84, 268], [72, 278], [60, 276], [50, 266], [41, 258]]),
        P(28, 257, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 257,
      controls: { knobs: [{ x: 100, y: -28 }, { x: 122, y: -54 }, { x: 86, y: -64 }, { x: 140, y: -24 }], switch: { x: 108, y: 186 }, jack: { x: 112, y: -88 }, jackAngle: 20 },
      strapButtons: [{ x: -60, y: -124 }, { x: -76, y: 322 }],
    },
    defaults: { scale: 648, frets: 21, thickness: 44.5, edgeRadius: 6, backRadius: 6, chamfer: 0, armContour: true, bellyCut: true, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'fender-6', bridge: 'vintage-trem', pickups: 'SS', switchType: 'toggle3', jack: 'strat-plate', volumes: 1, tones: 1, pickguard: 's-guard', neckAngle: 0 },
  },
  {
    id: 'superstrat',
    name: 'Super-S (Jackson / Ibanez-style pointy)',
    family: 'Bolt-on',
    shape: {
      points: [
        P(-28, 205, { corner: true, pocket: 'L' }),
        ...pts([[-38, 208], [-47, 218], [-54, 236], [-59, 258], [-64, 280], [-71, 300], [-80, 314], [-90, 315], [-97, 302], [-101, 280], [-106, 252], [-118, 224], [-134, 196], [-143, 166], [-138, 136], [-125, 110], [-122, 84], [-136, 52], [-154, 18], [-162, -18], [-157, -54], [-136, -82], [-98, -100], [-50, -108], [0, -110], [50, -108], [98, -100], [136, -82], [157, -54], [162, -18], [154, 18], [138, 50], [126, 80], [124, 108], [133, 136], [136, 164], [126, 190], [110, 212], [100, 238], [92, 262], [84, 280], [74, 290], [64, 288], [56, 274], [49, 252], [42, 226], [35, 210]]),
        P(28, 203, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 205,
      controls: { knobs: [{ x: 80, y: -34 }, { x: 104, y: -62 }, { x: 120, y: -10 }, { x: 60, y: -66 }], switch: { x: 96, y: 8 }, jack: { x: 126, y: -66 }, jackAngle: 35 },
      strapButtons: [{ x: 0, y: -108 }, { x: -78, y: 314 }],
    },
    defaults: { scale: 648, frets: 24, thickness: 40, edgeRadius: 8, backRadius: 8, chamfer: 0, armContour: true, bellyCut: true, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'pointy-6', bridge: 'floyd', pickups: 'HSH', switchType: 'blade5', jack: 'strat-plate', volumes: 1, tones: 1, pickguard: null, neckAngle: 0 },
  },
  {
    id: 'headless',
    name: 'Strandberg-style headless ergonomic',
    family: 'Headless',
    shape: {
      points: [
        P(-28, 200, { corner: true, pocket: 'L' }),
        ...pts([[-38, 203], [-47, 212], [-54, 228], [-60, 248], [-68, 268], [-78, 284], [-91, 292], [-101, 286], [-106, 268], [-110, 242], [-120, 214], [-133, 186], [-140, 156], [-135, 128], [-126, 104], [-127, 78], [-138, 46], [-146, 10], [-140, -24], [-124, -46], [-102, -56], [-80, -72], [-62, -94], [-32, -108], [10, -110], [52, -104], [92, -88], [126, -62], [144, -28], [146, 8], [136, 40], [122, 66], [118, 92], [124, 120], [126, 148], [116, 172], [102, 190], [92, 210], [84, 230], [74, 244], [62, 246], [53, 236], [46, 220], [37, 204]]),
        P(28, 198, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 200,
      controls: { knobs: [{ x: 70, y: -42 }, { x: 96, y: -30 }, { x: 116, y: -14 }, { x: 50, y: -56 }], switch: { x: 104, y: 22 }, jack: { x: 136, y: -42 }, jackAngle: -30 },
      strapButtons: [{ x: 10, y: -110 }, { x: -86, y: 296 }],
    },
    defaults: { scale: 648, frets: 24, thickness: 40, edgeRadius: 7, backRadius: 7, chamfer: 0, armContour: true, bellyCut: true, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'headless', bridge: 'headless-fixed', pickups: 'HH', switchType: 'blade5', jack: 'electrosocket', volumes: 1, tones: 1, pickguard: null, neckAngle: 0 },
  },
  {
    id: 'v-style',
    name: 'V-style',
    family: 'Set neck',
    shape: {
      points: [
        P(-28, 250, { corner: true, pocket: 'L' }),
        ...pts([[-42, 257], [-58, 250], [-90, 172], [-150, 10], [-198, -252]]),
        P(-208, -296, { corner: true }),
        ...pts([[-192, -304], [-120, -212], [-56, -132], [-22, -112], [0, -108], [22, -112], [56, -132], [120, -212], [192, -304]]),
        P(208, -296, { corner: true }),
        ...pts([[198, -252], [150, 10], [90, 172], [58, 250], [42, 257]]),
        P(28, 250, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 250,
      controls: { knobs: [{ x: 96, y: -120 }, { x: 116, y: -160 }, { x: 136, y: -200 }, { x: 156, y: -240 }], switch: { x: -110, y: -112 }, jack: { x: 150, y: -232 }, jackAngle: 0 },
      strapButtons: [{ x: -200, y: -300 }, { x: -42, y: 257 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 36, edgeRadius: 3, backRadius: 3, chamfer: 0, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'set', headstock: 'gibson-33', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'electrosocket', volumes: 2, tones: 1, pickguard: null, neckAngle: 3 },
  },
  {
    id: 'x-style',
    name: 'X-style (angular)',
    family: 'Set neck',
    shape: {
      points: [
        P(-28, 245, { corner: true, pocket: 'L' }),
        ...pts([[-31, 300]]),
        P(-40, 352, { corner: true }),
        P(-62, 344),
        P(-226, -30, { corner: true }),
        P(-218, -96, { corner: true }),
        P(-196, -118, { corner: true }),
        P(30, -118, { corner: true }),
        P(76, -74, { corner: true }),
        P(176, -124, { corner: true }),
        P(214, -104, { corner: true }),
        P(124, 136, { corner: true }),
        ...pts([[92, 184], [62, 206], [42, 214]]),
        P(28, 222, { corner: true, pocket: 'R' }),
      ],
      neckPocketY: 245,
      controls: { knobs: [{ x: 108, y: -60 }, { x: 128, y: -88 }, { x: 148, y: -40 }, { x: 88, y: -32 }], switch: { x: -110, y: 120 }, jack: { x: 150, y: -110 }, jackAngle: 0 },
      strapButtons: [{ x: -200, y: -116 }, { x: -40, y: 350 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 36, edgeRadius: 3, backRadius: 3, chamfer: 0, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'set', headstock: 'pointy-6', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'electrosocket', volumes: 2, tones: 1, pickguard: null, neckAngle: 3 },
  },
]

export const BODY_MAP = Object.fromEntries(BODY_TEMPLATES.map((t) => [t.id, t]))

export function bodyTemplate(id: string): BodyTemplate {
  return BODY_MAP[id] ?? BODY_TEMPLATES[0]
}

// --------------------------------------------------------------- pickguards

export const PICKGUARD_TEMPLATES: Record<string, ShapePoint[]> = {
  's-guard': [
    P(-28, 257, { corner: true, pocket: 'L' }),
    ...pts([[-34, 280], [-45, 298], [-61, 302], [-76, 290], [-90, 254], [-106, 226], [-120, 196], [-121, 160], [-108, 132], [-95, 106], [-86, 76], [-70, 50]]),
    P(-50, 24, { corner: true }),
    P(42, 24, { corner: true }),
    ...pts([[50, 0], [60, -30], [82, -62], [106, -78], [124, -72], [134, -52], [138, -22], [134, 12], [126, 42], [118, 72], [116, 102], [121, 132], [123, 162], [112, 190], [94, 212], [80, 240], [66, 266], [52, 272], [40, 266]]),
    P(28, 257, { corner: true, pocket: 'R' }),
  ],
  't-guard': [
    P(-28, 257, { corner: true, pocket: 'L' }),
    ...pts([[-38, 263], [-62, 264], [-96, 256], [-118, 238], [-132, 210], [-135, 174], [-126, 142], [-112, 118], [-94, 100], [-68, 86], [-36, 78], [0, 76], [26, 80], [50, 92], [66, 112], [78, 138], [90, 166], [100, 190], [96, 206], [76, 213], [52, 220], [36, 236]]),
    P(28, 257, { corner: true, pocket: 'R' }),
  ],
}
