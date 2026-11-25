import type { BodyShapeData, BridgeType, Construction, PickupLayout, ShapePoint, SwitchType, JackType } from '../types'

// Body outlines in mm with the bridge saddle line at y = 0, the strings along
// +y and the bass side at -x. Every outline is traced from a full-size plan in
// the plan library (see `source`) with tools/body-sources, and the bridge line
// comes from that plan's frets, nut or neck-bolt pattern. Points marked
// `pocket` snap to the neck width; `corner` points stay sharp.

export interface BodyTemplate {
  id: string
  name: string
  family: string
  /** Plan in the library (src/data/plans.ts) this outline was traced from, and how the bridge line was placed. */
  source: { plan: string; note: string }
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
    /** Neck width at the nut and the extra width at the last fret (mm), measured from the source plan. */
    nutWidth: number
    taper: number
  }
}

const P = (x: number, y: number, o: Partial<ShapePoint> = {}): ShapePoint => ({ x, y, ...o })
/** Mixed list of P(...) points and plain [x, y] tuples (traced outlines). */
const M = (...items: (ShapePoint | [number, number])[]): ShapePoint[] => items.map((q) => (Array.isArray(q) ? P(q[0], q[1]) : q))

export const BODY_TEMPLATES: BodyTemplate[] = [
  {
    id: 's-style',
    name: 'Fender-style S (double cut, contoured)',
    family: 'Bolt-on',
    source: { plan: 's-full-cad', note: 'S-style CAD plan; bridge line from its 21 fret slots (649 mm scale fit)' },
    shape: {
      points: M(P(-28.8, 247.5, { corner: true, pocket: 'L' }), [-32.0, 243.0], [-38.5, 238.4], [-55.2, 237.9], [-70.3, 244.3], [-80.4, 253.9], [-87.3, 267.1], [-90.7, 282.1], [-91.9, 294.0], [-92.2, 303.0], [-95.9, 311.6], [-97.4, 313.6], [-97.4, 317.1], [-99.4, 318.3], [-99.5, 319.7], [-100.9, 320.0], [-103.3, 321.4], [-117.5, 314.0], [-125.0, 306.8], [-134.0, 289.1], [-138.4, 259.1], [-135.6, 228.9], [-129.6, 199.0], [-121.7, 169.7], [-116.0, 151.1], [-114.2, 140.3], [-114.0, 118.4], [-115.8, 110.1], [-117.4, 102.8], [-125.9, 81.5], [-137.7, 53.3], [-147.9, 24.7], [-155.9, -4.6], [-160.9, -34.6], [-160.0, -64.9], [-149.9, -93.4], [-130.2, -116.5], [-104.3, -132.1], [-75.1, -140.4], [-44.9, -143.6], [-14.4, -144.0], [15.9, -144.1], [46.4, -143.8], [76.6, -141.2], [105.5, -131.8], [131.1, -115.7], [150.1, -92.0], [158.9, -63.0], [159.3, -32.7], [153.6, -2.9], [144.3, 26.0], [132.5, 54.1], [120.1, 81.9], [115.4, 96.6], [114.3, 111.4], [117.3, 129.6], [121.2, 140.9], [132.7, 169.1], [139.6, 198.6], [140.1, 216.1], [137.6, 228.7], [128.9, 246.6], [122.0, 251.4], [120.1, 251.5], [115.6, 251.5], [111.1, 251.4], [105.2, 247.7], [101.3, 241.4], [99.8, 234.6], [95.9, 219.6], [88.8, 206.5], [81.9, 199.4], [70.0, 193.1], [63.2, 191.7], [58.2, 191.7], [53.2, 191.7], [33.9, 198.4], [30.7, 200.8], P(28.9, 203.7, { corner: true, pocket: 'R' })),
      neckPocketY: 247.5,
      controls: { knobs: [{ x: 54.7, y: 31.2 }, { x: 93.6, y: 10.6 }, { x: 127.2, y: -18.3 }, { x: 104, y: -52 }], switch: { x: 93.3, y: 71 }, jack: { x: 77.4, y: -47.5 }, jackAngle: 35 },
      strapButtons: [{ x: 0, y: -144.1 }, { x: -103.7, y: 321.4 }],
    },
    defaults: { scale: 648, frets: 22, thickness: 44.5, edgeRadius: 6.5, backRadius: 6.5, chamfer: 0, armContour: true, bellyCut: true, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'fender-6', bridge: 'vintage-trem', pickups: 'SSS', switchType: 'blade5', jack: 'strat-plate', volumes: 1, tones: 2, pickguard: 's-guard', neckAngle: 0, nutWidth: 42, taper: 13.7 },
  },
  {
    id: 't-style',
    name: 'Fender-style T (single cut slab)',
    family: 'Bolt-on',
    source: { plan: 't-body-cad', note: 'T-style CAD plan; bridge line from the Fender neck-bolt pattern, checked against the S-style plan' },
    shape: {
      points: M(P(-28.1, 246.5, { corner: true, pocket: 'L' }), [-29.7, 242.9], [-36.5, 239.1], [-40.9, 239.8], [-52.9, 246.9], [-81.3, 257.6], [-98.1, 259.2], [-111.0, 256.8], [-125.3, 248.9], [-133.5, 237.7], [-137.7, 226.5], [-140.0, 208.2], [-139.2, 193.8], [-135.7, 178.3], [-125.1, 149.7], [-118.4, 133.1], [-115.3, 121.0], [-114.3, 107.1], [-117.0, 90.9], [-128.1, 62.6], [-141.3, 35.3], [-152.4, 6.9], [-160.0, -22.5], [-161.9, -52.7], [-155.4, -82.3], [-140.2, -108.5], [-117.4, -128.4], [-89.4, -139.8], [-59.3, -144.3], [-29.0, -145.9], [1.5, -146.3], [32.0, -145.9], [62.3, -144.0], [92.2, -139.1], [119.9, -126.9], [142.1, -106.1], [156.5, -79.6], [162.1, -49.9], [159.5, -19.6], [151.5, 9.7], [140.1, 37.9], [126.9, 65.3], [120.2, 80.9], [116.3, 93.7], [114.2, 107.5], [115.8, 123.9], [126.0, 152.5], [135.8, 181.3], [138.7, 211.5], [137.0, 226.8], [131.6, 240.7], [121.0, 250.9], [106.1, 250.4], [96.5, 240.0], [91.7, 224.8], [88.3, 214.9], [78.1, 197.8], [66.4, 187.9], [52.0, 184.2], [37.8, 189.5], [29.7, 201.9], P(27.9, 206.6, { corner: true, pocket: 'R' })),
      neckPocketY: 246.5,
      controls: { knobs: [{ x: 91.8, y: -0.2 }, { x: 91.8, y: -38.2 }, { x: 116, y: -62 }, { x: 70, y: -66 }], switch: { x: 91.8, y: 37.8 }, jack: { x: 161.9, y: -39.9 }, jackAngle: 3 },
      strapButtons: [{ x: 0, y: -146.3 }, { x: -95.1, y: 259.2 }],
    },
    defaults: { scale: 648, frets: 22, thickness: 44.5, edgeRadius: 2, backRadius: 2, chamfer: 0, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'tele-6', bridge: 'tele', pickups: 'T', switchType: 'blade3', jack: 'tele-cup', volumes: 1, tones: 1, pickguard: 't-guard', neckAngle: 0, nutWidth: 42, taper: 13.7 },
  },
  {
    id: 'lp-style',
    name: 'Gibson-style LP (single cut, carved top)',
    family: 'Set neck',
    source: { plan: 'lp-full-cad', note: 'LP-style CAD plan; bridge line from its frets (24.75" scale)' },
    shape: {
      points: M(P(-28.5, 251.5, { corner: true, pocket: 'L' }), [-58.6, 247.6], [-86.6, 235.9], [-108.4, 214.9], [-119.6, 186.9], [-115.7, 157.0], [-103.2, 129.3], [-97.2, 117.3], [-93.0, 100.9], [-95.6, 83.3], [-101.6, 72.4], [-121.6, 49.5], [-140.1, 25.3], [-153.9, -1.8], [-162.1, -31.0], [-163.7, -60.8], [-159.0, -90.8], [-147.7, -119.0], [-129.6, -143.4], [-106.1, -162.6], [-79.1, -176.5], [-49.7, -184.2], [-19.5, -187.5], [10.9, -188.0], [41.1, -185.5], [70.9, -179.4], [98.7, -167.2], [123.4, -149.5], [143.2, -126.5], [156.5, -99.2], [163.1, -69.6], [163.3, -39.2], [156.9, -9.6], [144.4, 18.2], [127.2, 43.2], [106.9, 65.9], [98.6, 77.2], [93.3, 92.6], [93.3, 103.6], [95.4, 112.3], [99.4, 121.9], [112.5, 149.4], [116.3, 161.3], [117.9, 179.1], [113.9, 198.5], [111.0, 201.9], [105.4, 203.7], [97.9, 200.5], [92.6, 192.6], [83.4, 184.3], [72.0, 179.3], [54.2, 180.4], [41.8, 187.6], [32.5, 200.4], P(29.0, 211.8, { corner: true, pocket: 'R' })),
      neckPocketY: 251.5,
      controls: { knobs: [{ x: 76.2, y: -50.9 }, { x: 121.2, y: -23.8 }, { x: 76.1, y: -109.4 }, { x: 119.3, y: -83.2 }], switch: { x: -77.2, y: 187.4 }, jack: { x: 161.5, y: -80.4 }, jackAngle: -11 },
      strapButtons: [{ x: 0, y: -188.1 }, { x: -55.2, y: 248.3 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 44, edgeRadius: 2, backRadius: 2, chamfer: 0, armContour: false, bellyCut: false, carved: true, carveHeight: 13, carveWidth: 48, recurve: 0.35, construction: 'set', headstock: 'gibson-33', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'lp-plate', volumes: 2, tones: 2, pickguard: null, neckAngle: 4, nutWidth: 42.86, taper: 13.7 },
  },
  {
    id: 'prs-style',
    name: 'PRS-style double cut (carved top)',
    family: 'Set neck',
    source: { plan: 'prs-body-hairline', note: 'PRS-style full plan; saddle and nut marks 635 mm apart' },
    shape: {
      // traced from the PRS-style full plan (public/plans/prs-style/prs-body-hairline.svg); its saddle and nut marks are 635 mm apart.
      // Knobs, switch and jack come from the plan's control holes (the last two knobs are extras for 2+2 wiring).
      points: M(P(-28.2, 179.4, { corner: true, pocket: 'L' }), [-41.8, 183.9], [-56.3, 191.2], [-69.6, 201.4], [-78.4, 212.0], [-86.5, 229.3], [-88.4, 240.5], [-88.9, 248.9], [-91.3, 258.8], [-94.7, 262.8], [-101.1, 264.0], [-113.9, 257.9], [-122.7, 244.5], [-126.0, 214.3], [-118.5, 184.8], [-105.9, 157.0], [-99.5, 127.1], [-100.8, 96.7], [-111.8, 68.2], [-127.1, 41.7], [-142.5, 15.3], [-155.2, -12.5], [-163.1, -42.0], [-164.4, -72.5], [-156.9, -102.0], [-141.9, -128.6], [-120.5, -150.3], [-94.5, -166.3], [-65.7, -176.6], [-35.7, -182.3], [-5.2, -184.3], [25.4, -183.4], [55.7, -179.1], [85.0, -170.5], [112.2, -156.6], [135.5, -136.9], [152.9, -111.9], [163.1, -83.1], [164.9, -52.7], [159.5, -22.6], [148.6, 5.9], [133.8, 32.6], [117.3, 58.4], [103.2, 85.5], [100.2, 98.9], [101.3, 115.7], [106.5, 132.2], [112.0, 144.2], [123.3, 172.6], [123.8, 186.9], [116.9, 201.3], [111.2, 205.7], [102.4, 206.9], [91.8, 197.7], [82.7, 186.5], [69.1, 178.0], [52.8, 174.0], [39.1, 172.9], P(28.3, 172.7, { corner: true, pocket: 'R' })),
      neckPocketY: 179.4,
      controls: { knobs: [{ x: 82.3, y: 21.5 }, { x: 56.2, y: -84.4 }, { x: 110, y: -12 }, { x: 84, y: -125 }], switch: { x: 100.4, y: -51.3 }, jack: { x: 158.2, y: -100 }, jackAngle: -21 },
      strapButtons: [{ x: 0, y: -184.4 }, { x: -100.5, y: 264 }],
    },
    defaults: { scale: 635, frets: 24, thickness: 46, edgeRadius: 2.5, backRadius: 3, chamfer: 0, armContour: false, bellyCut: false, carved: true, carveHeight: 10, carveWidth: 36, recurve: 0.15, construction: 'set', headstock: 'prs-33', bridge: 'fixed', pickups: 'HH', switchType: 'blade5', jack: 'electrosocket', volumes: 1, tones: 1, pickguard: null, neckAngle: 3, nutWidth: 42.06, taper: 14.97 },
  },
  {
    id: 'sg-style',
    name: 'Gibson-style SG (twin horns, bevelled)',
    family: 'Set neck',
    source: { plan: 'sg-full-cad', note: 'SG-style CAD plan; bridge line from its frets (24.75" scale)' },
    shape: {
      points: M(P(-28.9, 183.1, { corner: true, pocket: 'L' }), [-33.9, 172.8], [-48.8, 161.4], [-61.0, 159.3], [-70.2, 161.1], [-77.5, 165.3], [-88.3, 178.9], [-90.8, 191.5], [-88.0, 209.7], [-85.0, 218.2], [-85.5, 221.1], [-89.9, 222.3], [-110.1, 207.0], [-127.7, 182.3], [-137.5, 153.6], [-141.1, 123.4], [-138.1, 93.2], [-129.1, 64.2], [-123.3, 49.9], [-119.1, 35.5], [-117.8, 16.2], [-120.7, 5.7], [-137.4, -19.7], [-156.2, -43.7], [-168.9, -71.2], [-173.0, -101.2], [-169.3, -131.0], [-155.6, -157.9], [-133.0, -178.1], [-105.8, -191.6], [-76.7, -200.3], [-46.6, -205.0], [-16.4, -207.4], [14.1, -207.7], [44.3, -204.9], [74.3, -200.2], [103.5, -191.8], [129.7, -176.4], [150.6, -154.5], [164.1, -127.3], [167.4, -97.2], [161.2, -67.6], [148.4, -40.0], [130.6, -15.4], [122.6, -5.2], [115.2, 10.6], [113.0, 28.3], [114.7, 40.7], [119.3, 55.9], [125.1, 69.2], [130.1, 81.1], [134.2, 98.0], [135.0, 128.4], [127.8, 157.8], [113.6, 184.6], [102.2, 197.9], [97.7, 201.0], P(96.2, 201.0, { corner: true }), [95.5, 199.8], [95.5, 195.3], [93.2, 182.6], [84.0, 167.9], [69.7, 160.2], [55.8, 160.1], [40.8, 166.4], [31.7, 176.9], P(29.0, 182.8, { corner: true, pocket: 'R' })),
      neckPocketY: 183.1,
      controls: { knobs: [{ x: 87.2, y: -103.3 }, { x: 127.8, y: -102.5 }, { x: 73.8, y: -149.5 }, { x: 114.1, y: -151.8 }], switch: { x: 104.8, y: -51.5 }, jack: { x: 88.9, y: -196.8 }, jackAngle: -75 },
      strapButtons: [{ x: 0, y: -207.9 }, { x: -88.5, y: 222.6 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 35, edgeRadius: 1.5, backRadius: 1.5, chamfer: 9, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'set', headstock: 'gibson-33', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'electrosocket', volumes: 2, tones: 2, pickguard: null, neckAngle: 3, nutWidth: 42.86, taper: 13.7 },
  },
  {
    id: 'reverse-style',
    name: 'Gibson-style reverse (neck-through)',
    family: 'Neck-through',
    source: { plan: 'reverse-full-cad', note: 'Reverse-body CAD plan; bridge line from its frets (24.75" scale)' },
    shape: {
      points: M(P(-28.9, 220.9, { corner: true, pocket: 'L' }), [-31.6, 209.7], [-39.8, 192.7], [-50.6, 182.4], [-64.6, 175.9], [-93.3, 166.0], [-109.9, 159.1], [-120.6, 152.7], [-130.5, 142.9], [-138.3, 128.4], [-141.6, 112.9], [-140.8, 98.4], [-131.8, 69.5], [-120.0, 41.4], [-109.9, 12.8], [-105.6, -17.3], [-108.7, -47.5], [-117.6, -76.5], [-130.3, -104.2], [-144.2, -131.2], [-157.6, -158.5], [-170.2, -186.2], [-175.1, -201.8], [-176.7, -215.7], [-173.8, -231.4], [-166.6, -243.3], [-151.6, -253.8], [-140.1, -257.0], [-109.8, -257.3], [-79.7, -252.8], [-50.3, -245.3], [-21.3, -236.0], [7.3, -225.6], [35.5, -214.2], [63.5, -202.2], [91.0, -189.3], [118.2, -175.6], [144.6, -160.6], [154.0, -153.1], [162.9, -137.2], [163.5, -122.3], [159.2, -107.5], [147.1, -79.6], [135.2, -51.6], [127.1, -22.3], [125.6, 8.0], [129.4, 38.1], [136.7, 67.7], [145.9, 96.6], [156.3, 125.2], [166.1, 154.0], [173.7, 183.4], [174.9, 194.7], [172.8, 213.5], [164.0, 229.0], [153.6, 235.7], [136.4, 236.5], [124.5, 231.3], [112.5, 220.9], [103.6, 209.5], [95.9, 199.0], [83.1, 187.3], [66.3, 181.2], [54.1, 182.7], [39.6, 193.0], [33.2, 203.7], P(29.0, 218.0, { corner: true, pocket: 'R' })),
      neckPocketY: 220.9,
      controls: { knobs: [{ x: 77.3, y: -90 }, { x: 113.2, y: -92.8 }, { x: 77.3, y: -127.9 }, { x: 121.6, y: -132.6 }], switch: { x: 139, y: 193.6 }, jack: { x: 102.2, y: -183.8 }, jackAngle: -63 },
      strapButtons: [{ x: 0, y: -228.3 }, { x: -48.5, y: 183.8 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 44, edgeRadius: 2.5, backRadius: 2.5, chamfer: 0, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'neck-through', headstock: 'reverse-6', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'electrosocket', volumes: 2, tones: 2, pickguard: null, neckAngle: 3, nutWidth: 42.86, taper: 13.7 },
  },
  {
    id: 'offset-style',
    name: 'Fender-style offset (JM / JG)',
    family: 'Bolt-on',
    source: { plan: 'offset-body-routes', note: 'Offset body route plan; bridge line from its neck bolts, matching the bridge post holes' },
    shape: {
      points: M(P(-28.1, 255.4, { corner: true, pocket: 'L' }), [-32.4, 249.3], [-38.3, 244.8], [-46.5, 242.9], [-53.3, 244.3], [-67.8, 253.1], [-77.9, 262.0], [-85.2, 270.2], [-99.4, 283.5], [-111.3, 290.6], [-127.3, 288.6], [-136.4, 279.0], [-139.6, 262.4], [-138.4, 232.1], [-132.5, 202.2], [-125.0, 172.8], [-116.7, 143.6], [-115.1, 130.2], [-115.8, 113.3], [-117.9, 102.0], [-125.3, 84.6], [-130.8, 71.7], [-138.7, 57.3], [-152.3, 30.1], [-164.6, 2.3], [-174.1, -26.6], [-176.4, -56.8], [-171.1, -86.7], [-158.5, -114.3], [-139.3, -137.9], [-114.8, -155.8], [-87.0, -168.1], [-58.2, -177.8], [-28.7, -185.2], [1.3, -190.6], [31.4, -194.1], [61.7, -195.8], [92.1, -194.6], [121.9, -188.7], [132.3, -185.1], [148.8, -175.0], [157.4, -166.7], [167.3, -151.1], [174.4, -121.7], [172.5, -91.5], [162.4, -62.9], [146.7, -36.8], [130.6, -11.0], [120.1, 17.5], [117.9, 30.2], [119.6, 47.6], [130.0, 76.2], [139.0, 105.2], [142.6, 135.3], [142.1, 149.8], [138.5, 165.3], [132.3, 178.9], [121.5, 189.7], [104.6, 195.4], [92.3, 194.0], [77.7, 188.9], [63.0, 186.7], [43.5, 190.5], [34.9, 196.4], [29.8, 204.3], P(27.9, 211.5, { corner: true, pocket: 'R' })),
      neckPocketY: 255.4,
      controls: { knobs: [{ x: 100, y: -28 }, { x: 122, y: -54 }, { x: 86, y: -64 }, { x: 136, y: -86 }], switch: { x: 96, y: 168 }, jack: { x: 112, y: -88 }, jackAngle: 20 },
      strapButtons: [{ x: 0, y: -190.4 }, { x: -118.2, y: 291.2 }],
    },
    defaults: { scale: 648, frets: 21, thickness: 44.5, edgeRadius: 6, backRadius: 6, chamfer: 0, armContour: true, bellyCut: true, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'fender-6', bridge: 'vintage-trem', pickups: 'SS', switchType: 'toggle3', jack: 'strat-plate', volumes: 1, tones: 1, pickguard: 'offset-guard', neckAngle: 0, nutWidth: 42, taper: 13.7 },
  },
  {
    id: 'headless',
    name: 'Strandberg-style headless ergonomic',
    family: 'Headless',
    source: { plan: 'headless-full-plan', note: 'Headless full plan (front view); fanned neck, bridge line at the middle string' },
    shape: {
      // traced from the front view of the headless full plan (public/plans/headless/headless-full-plan.svg). That neck is
      // fanned (25.5" bass, 25" treble), so the bridge line is the middle string's saddle. Knobs and switch come from the plan.
      points: M(P(-26.6, 241.2, { corner: true, pocket: 'L' }), [-36.0, 230.3], [-50.6, 224.4], [-66.4, 226.0], [-79.2, 232.5], [-89.9, 240.9], [-100.7, 253.7], [-115.0, 280.5], [-120.5, 298.0], [-123.9, 309.5], [-127.3, 312.7], [-131.8, 311.8], [-138.2, 292.4], [-136.4, 262.2], [-126.2, 233.6], [-113.8, 205.9], [-103.0, 177.5], [-96.5, 147.9], [-98.3, 117.6], [-102.9, 99.8], [-107.5, 88.8], [-111.5, 80.9], [-120.7, 61.4], [-133.4, 33.8], [-141.4, 15.4], [-145.4, 5.9], [-149.6, -10.4], [-149.5, -23.9], [-144.8, -38.3], [-137.7, -51.7], [-121.1, -77.2], [-102.4, -101.1], [-92.3, -108.9], [-75.4, -113.4], [-65.0, -112.9], [-56.4, -108.8], [-52.2, -99.5], [-43.4, -70.4], [-41.2, -61.9], [-39.5, -57.4], [-24.4, -50.2], [4.4, -40.8], [34.2, -35.9], [44.4, -43.0], [51.0, -59.2], [54.6, -64.5], [63.2, -65.3], [73.2, -54.1], [76.7, -49.8], [94.7, -32.8], [106.3, -24.2], [120.8, -17.5], [138.3, -12.0], [149.8, -8.5], [161.4, -0.9], [155.1, 13.4], [135.3, 36.5], [117.3, 60.9], [108.5, 89.7], [109.4, 120.0], [119.1, 148.7], [133.5, 175.4], [135.9, 183.1], [133.9, 190.6], [126.5, 193.2], [120.4, 191.6], [95.2, 174.6], [82.9, 168.9], [66.6, 165.1], [50.7, 165.6], [38.0, 172.1], [31.9, 185.0], [28.9, 200.7], [27.7, 213.5], P(26.2, 222.1, { corner: true, pocket: 'R' })),
      neckPocketY: 241.2,
      controls: { knobs: [{ x: 66.4, y: 23.1 }, { x: 107.4, y: 14.7 }, { x: 90, y: -12 }, { x: 45, y: -12 }], switch: { x: 92.6, y: 52.7 }, jack: { x: 114.9, y: -20 }, jackAngle: -67 },
      strapButtons: [{ x: -72, y: -113.4 }, { x: -128.9, y: 313 }],
    },
    defaults: { scale: 648, frets: 24, thickness: 40, edgeRadius: 7, backRadius: 7, chamfer: 0, armContour: true, bellyCut: true, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'bolt-on', headstock: 'headless', bridge: 'headless-fixed', pickups: 'HH', switchType: 'blade5', jack: 'electrosocket', volumes: 1, tones: 1, pickguard: null, neckAngle: 0, nutWidth: 41.3, taper: 13 },
  },
  {
    id: 'v-style',
    name: 'V-style',
    family: 'Set neck',
    source: { plan: 'v-58-plan', note: '1958 V-style plan; bridge line from its nut and 12th-fret marks (24.75" scale)' },
    shape: {
      points: M(P(-28.0, 202.4, { corner: true, pocket: 'L' }), [-29.1, 189.1], [-39.1, 175.7], [-49.9, 170.7], [-58.2, 169.3], [-61.0, 166.5], [-63.0, 160.8], [-73.5, 132.3], [-84.0, 103.7], [-94.4, 75.1], [-104.9, 46.5], [-115.4, 18.0], [-125.8, -10.6], [-136.3, -39.2], [-146.8, -67.8], [-157.2, -96.3], [-167.7, -124.9], [-178.1, -153.5], [-188.6, -182.1], [-199.1, -210.6], [-209.5, -239.2], [-220.0, -267.8], [-225.0, -282.9], [-222.9, -297.0], [-212.7, -307.7], [-197.7, -310.3], [-185.6, -304.8], [-174.1, -292.3], [-153.9, -269.6], [-133.6, -246.9], [-113.4, -224.1], [-93.1, -201.4], [-72.8, -178.6], [-52.6, -155.9], [-32.3, -133.2], [-11.0, -111.7], [5.0, -109.6], [13.6, -113.3], [17.0, -116.3], [23.7, -123.7], [37.4, -138.9], [57.6, -161.7], [77.9, -184.4], [98.1, -207.1], [118.4, -229.9], [138.7, -252.6], [158.9, -275.3], [179.2, -298.1], [188.1, -306.7], [195.4, -309.9], [205.3, -310.2], [213.2, -307.3], [219.4, -302.2], [225.0, -289.6], [224.5, -280.7], [217.3, -260.5], [206.8, -231.9], [196.3, -203.4], [185.9, -174.8], [175.4, -146.2], [165.0, -117.6], [154.5, -89.0], [144.0, -60.5], [133.6, -31.9], [123.1, -3.3], [112.7, 25.3], [102.2, 53.8], [91.7, 82.4], [81.3, 111.0], [70.8, 139.6], [63.6, 159.2], [59.9, 167.9], [46.2, 171.8], [39.2, 175.5], [33.5, 181.1], [28.6, 190.3], P(27.9, 196.2, { corner: true, pocket: 'R' })),
      neckPocketY: 202.4,
      controls: { knobs: [{ x: 96, y: -120 }, { x: 116, y: -160 }, { x: 136, y: -200 }, { x: 156, y: -240 }], switch: { x: -110, y: -112 }, jack: { x: 218.1, y: -262.9 }, jackAngle: 20 },
      strapButtons: [{ x: -218.3, y: -303.5 }, { x: -56.4, y: 169.9 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 36, edgeRadius: 3, backRadius: 3, chamfer: 0, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'set', headstock: 'v-33', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'electrosocket', volumes: 2, tones: 1, pickguard: null, neckAngle: 3, nutWidth: 42.86, taper: 13.7 },
  },
  {
    id: 'x-style',
    name: 'X-style (angular)',
    family: 'Set neck',
    source: { plan: 'x-76-plan', note: '1976 X-style plan; bridge line from its nut (24.75" scale), matching the bridge posts' },
    shape: {
      points: M(P(-28.9, 205.8, { corner: true, pocket: 'L' }), [-34.7, 194.2], [-47.3, 182.3], [-58.8, 177.5], [-75.6, 171.3], [-83.5, 168.3], [-88.8, 163.8], [-92.0, 156.0], [-91.6, 149.5], [-87.7, 119.4], [-83.7, 89.3], [-79.8, 59.2], [-78.0, 45.4], [-79.9, 29.1], [-82.6, 21.6], [-93.8, 2.1], [-109.1, -24.2], [-124.4, -50.6], [-139.7, -76.9], [-155.0, -103.3], [-170.3, -129.6], [-185.6, -156.0], [-200.9, -182.3], [-216.2, -208.7], [-231.5, -235.0], [-242.0, -253.1], [-246.8, -261.4], [-247.7, -267.9], [-243.7, -274.0], [-238.2, -276.0], [-228.2, -275.2], [-198.1, -271.5], [-168.1, -266.2], [-138.4, -259.7], [-109.0, -252.1], [-79.8, -243.7], [-50.8, -234.4], [-22.2, -224.3], [6.3, -213.5], [34.5, -201.9], [62.2, -189.4], [89.6, -176.1], [116.4, -161.8], [142.5, -146.1], [156.3, -137.0], [162.3, -132.6], [165.1, -126.9], [163.0, -117.7], [156.1, -98.0], [145.9, -69.3], [135.8, -40.6], [125.7, -12.0], [115.5, 16.7], [111.8, 30.1], [112.3, 46.5], [115.4, 56.5], [121.8, 75.4], [131.5, 104.2], [141.3, 133.0], [151.0, 161.8], [160.7, 190.5], [170.5, 219.3], [180.2, 248.1], [184.1, 263.9], [181.5, 270.4], [176.1, 274.6], [169.8, 275.8], [164.1, 274.2], [159.4, 270.4], [150.5, 262.5], [127.7, 242.2], [105.0, 221.9], [82.3, 201.6], [70.2, 191.2], [56.6, 187.0], [40.4, 191.2], [31.2, 200.8], P(28.9, 205.8, { corner: true, pocket: 'R' })),
      neckPocketY: 205.8,
      controls: { knobs: [{ x: 99, y: -40.9 }, { x: 80.9, y: -87.8 }, { x: 62.8, y: -134.6 }, { x: 44.7, y: -181.4 }], switch: { x: 138.5, y: 211.3 }, jack: { x: 137.1, y: -44.4 }, jackAngle: 19 },
      strapButtons: [{ x: -239.6, y: -275.8 }, { x: -63.9, y: 175.6 }],
    },
    defaults: { scale: 628, frets: 22, thickness: 36, edgeRadius: 3, backRadius: 3, chamfer: 0, armContour: false, bellyCut: false, carved: false, carveHeight: 0, carveWidth: 40, recurve: 0, construction: 'set', headstock: 'hockey-6', bridge: 'tom', pickups: 'HH', switchType: 'toggle3', jack: 'electrosocket', volumes: 2, tones: 1, pickguard: null, neckAngle: 3, nutWidth: 42.86, taper: 13.7 },
  },
]

export const BODY_MAP = Object.fromEntries(BODY_TEMPLATES.map((t) => [t.id, t]))

export function bodyTemplate(id: string): BodyTemplate {
  return BODY_MAP[id] ?? BODY_TEMPLATES[0]
}

// --------------------------------------------------------------- pickguards

export interface PickguardTemplate {
  id: string
  name: string
  /** Plan in the library this guard was traced from. */
  source: { plan: string; note: string }
  points: ShapePoint[]
}

// Pickguards in body space, traced from the same plans as their bodies.
export const PICKGUARDS: PickguardTemplate[] = [
  { id: 's-guard', name: 'S-style guard (11 hole)', source: { plan: 's-full-cad', note: 'Pickguard outline from the S-style CAD front view' }, points: M(P(-28.6, 211.6, { corner: true, pocket: 'L' }), [-38.7, 215.8], [-45.8, 218.0], [-51.8, 215.8], [-54.6, 211.2], [-49.6, 181.6], [-48.1, 151.5], [-52.8, 121.7], [-62.9, 93.1], [-72.8, 64.5], [-75.2, 47.4], [-74.8, 34.4], [-72.1, 20.9], [-64.0, 6.6], [-52.9, -1.5], [-44.3, -3.5], P(-38.3, -3.3, { corner: true }), [-38.3, -1.8], [-38.2, 7.2], [-36.3, 10.6], [-30.1, 11.8], [-19.1, 11.8], [10.9, 11.8], [27.9, 11.8], [34.3, 11.6], [37.5, 9.3], [38.2, 6.5], P(38.2, -3.0, { corner: true }), [59.0, -4.0], [72.7, -6.2], [87.7, -12.7], [111.4, -31.6], [122.8, -40.5], [126.8, -43.4], [131.9, -45.4], [137.3, -45.2], [143.8, -41.8], [147.9, -35.0], [147.1, -20.2], [138.8, 8.9], [127.4, 37.0], [114.7, 64.4], [104.4, 92.9], [102.2, 106.5], [103.4, 122.8], [108.2, 141.1], [112.5, 151.7], [123.2, 180.0], [127.6, 209.8], [119.2, 238.5], [115.2, 240.3], [113.0, 238.8], [112.2, 234.9], [108.4, 216.5], [104.1, 205.4], [93.0, 190.9], [79.7, 182.3], [65.8, 178.5], [57.4, 178.0], [51.1, 179.2], [36.6, 184.4], P(28.8, 187.5, { corner: true, pocket: 'R' })) },
  { id: 't-guard', name: 'T-style guard', source: { plan: 't-body-cad', note: 'Pickguard drawing in the T-style CAD, placed by its screw holes' }, points: M(P(-28.8, 225.4, { corner: true, pocket: 'L' }), [-33.6, 224.5], [-42.1, 220.5], [-52.8, 208.8], [-67.9, 182.5], [-77.5, 153.8], [-82.9, 124.2], [-84.4, 93.9], [-82.8, 73.7], [-80.3, 64.1], [-76.6, 57.9], [-69.6, 57.7], [-53.6, 57.7], P(-44.1, 57.7, { corner: true }), [-43.0, 67.8], [-40.1, 69.7], [-33.2, 69.8], [-3.2, 69.8], [26.8, 69.8], [42.5, 68.4], P(43.9, 57.8, { corner: true }), [47.3, 57.7], P(75.7, 57.9, { corner: true }), [76.2, 59.8], [77.1, 63.6], [80.5, 68.6], [85.5, 71.9], [92.2, 73.2], [99.3, 71.1], [103.0, 68.6], [106.5, 63.7], P(107.8, 57.9, { corner: true }), [119.2, 57.9], [121.0, 59.5], [119.6, 66.1], [111.3, 87.9], [109.2, 97.6], [109.1, 117.9], [117.8, 146.8], [128.6, 175.2], [133.4, 204.9], [128.7, 234.5], [118.9, 245.9], [110.6, 246.4], [105.1, 243.1], [101.3, 237.4], [94.2, 215.1], [89.8, 205.6], [78.1, 189.6], [66.1, 181.8], [50.6, 178.9], [39.6, 181.8], [32.4, 187.1], [30.0, 189.5], P(28.6, 189.8, { corner: true, pocket: 'R' })) },
  { id: 'offset-guard', name: 'Offset guard', source: { plan: 'offset-body-routes', note: 'Pickguard drawing on the offset route plan, placed by its neck notch' }, points: M(P(-28.8, 212.3, { corner: true, pocket: 'L' }), [-38.1, 218.1], [-44.5, 217.8], [-57.3, 219.1], [-64.8, 221.8], [-83.0, 234.9], [-88.0, 238.9], [-95.5, 240.1], [-102.8, 234.5], [-104.4, 228.3], [-104.9, 216.5], [-101.5, 198.5], [-94.6, 169.1], [-86.6, 139.9], [-77.3, 111.0], [-66.9, 82.4], [-61.0, 67.6], [-57.7, 53.6], [-57.6, 43.7], [-57.2, 23.3], [-53.4, -6.6], [-51.2, -12.7], [-44.9, -18.8], [-38.3, -20.9], [-30.3, -20.9], [-0.3, -20.9], [29.7, -20.9], [46.6, -21.7], [58.3, -28.1], [78.8, -50.5], [84.9, -58.3], [99.2, -72.9], [115.9, -85.5], [124.4, -89.6], [138.3, -92.9], [143.8, -93.2], [148.4, -91.7], [152.1, -87.7], [153.1, -80.9], [150.4, -74.6], [142.9, -60.0], [134.5, -46.5], [126.3, -34.5], [112.7, -7.5], [104.9, 21.7], [104.8, 39.0], [107.1, 51.6], [112.1, 65.7], [118.7, 79.6], [127.5, 108.5], [130.2, 138.6], [121.5, 167.2], [110.4, 176.8], [95.3, 177.6], [85.3, 173.2], [66.4, 169.1], [49.2, 170.8], [37.1, 175.3], P(28.6, 180.5, { corner: true, pocket: 'R' })) },
]

export const PICKGUARD_TEMPLATES: Record<string, ShapePoint[]> = Object.fromEntries(PICKGUARDS.map((p) => [p.id, p.points]))
