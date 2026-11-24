import type { HeadstockShapeData, ShapePoint } from '../types'

// Headstock outlines in headstock space: y = 0 at the nut, +y away from the
// body, bass side at -x. `pocket` points snap to the neck width at the nut.

export interface HeadstockTemplate {
  id: string
  name: string
  shape: HeadstockShapeData
  angle: number
}

const P = (x: number, y: number, o: Partial<ShapePoint> = {}): ShapePoint => ({ x, y, ...o })
const pts = (arr: [number, number][]): ShapePoint[] => arr.map(([x, y]) => P(x, y))

export const HEADSTOCK_TEMPLATES: HeadstockTemplate[] = [
  {
    id: 'fender-6',
    name: 'Fender-style 6-in-line',
    angle: 0,
    shape: {
      points: [
        P(-22, 0, { corner: true, pocket: 'L' }),
        ...pts([[-23, 20], [-27, 36], [-35, 46], [-38, 62], [-38, 120], [-37, 166], [-32, 184], [-18, 194], [0, 196], [15, 189], [23, 172], [21, 153], [13, 138], [10, 120], [15, 96], [23, 72], [26, 50], [24, 26]]),
        P(22, 0, { corner: true, pocket: 'R' }),
      ],
      tuners: { mode: 'inline', a: [{ x: -21, y: 52 }, { x: -21, y: 172 }], side: 'L' },
    },
  },
  {
    id: 'pointy-6',
    name: 'Pointy 6-in-line (super-S style)',
    angle: 0,
    shape: {
      points: [
        P(-22, 0, { corner: true, pocket: 'L' }),
        ...pts([[-24, 28], [-29, 60], [-36, 104], [-44, 150], [-52, 196]]),
        P(-60, 214, { corner: true }),
        ...pts([[-44, 210], [-20, 182], [0, 148], [14, 110], [22, 70], [24, 34]]),
        P(22, 0, { corner: true, pocket: 'R' }),
      ],
      tuners: { mode: 'inline', a: [{ x: -14, y: 48 }, { x: -38, y: 186 }], side: 'L' },
    },
  },
  {
    id: 'gibson-33',
    name: 'Gibson-style 3+3 open book',
    angle: 14,
    shape: {
      points: [
        P(-22, 0, { corner: true, pocket: 'L' }),
        ...pts([[-28, 18], [-38, 46], [-43, 90], [-45, 140], [-43, 166], [-33, 180], [-15, 178]]),
        P(0, 170, { corner: true }),
        ...pts([[15, 178], [33, 180], [43, 166], [45, 140], [43, 90], [38, 46], [28, 18]]),
        P(22, 0, { corner: true, pocket: 'R' }),
      ],
      tuners: { mode: 'split', a: [{ x: -30, y: 52 }, { x: -33, y: 146 }], b: [{ x: 30, y: 52 }, { x: 33, y: 146 }] },
    },
  },
  {
    id: 'prs-33',
    name: 'PRS-style 3+3',
    angle: 10,
    shape: {
      points: [
        P(-22, 0, { corner: true, pocket: 'L' }),
        ...pts([[-28, 22], [-38, 50], [-42, 88], [-41, 128], [-36, 160], [-23, 180], [0, 187], [23, 180], [36, 160], [41, 128], [42, 88], [38, 50], [28, 22]]),
        P(22, 0, { corner: true, pocket: 'R' }),
      ],
      tuners: { mode: 'split', a: [{ x: -27, y: 54 }, { x: -27, y: 150 }], b: [{ x: 27, y: 54 }, { x: 27, y: 150 }] },
    },
  },
  {
    id: 'paddle-33',
    name: 'Simple 3+3 paddle',
    angle: 12,
    shape: {
      points: [
        P(-22, 0, { corner: true, pocket: 'L' }),
        ...pts([[-34, 22], [-42, 56], [-42, 166], [-36, 182], [0, 188], [36, 182], [42, 166], [42, 56], [34, 22]]),
        P(22, 0, { corner: true, pocket: 'R' }),
      ],
      tuners: { mode: 'split', a: [{ x: -28, y: 60 }, { x: -28, y: 160 }], b: [{ x: 28, y: 60 }, { x: 28, y: 160 }] },
    },
  },
  {
    id: 'hockey-6',
    name: 'Long 6-in-line (X-style)',
    angle: 8,
    shape: {
      points: [
        P(-22, 0, { corner: true, pocket: 'L' }),
        ...pts([[-24, 40], [-30, 120], [-36, 196]]),
        P(-40, 226, { corner: true }),
        ...pts([[-20, 230], [4, 214], [16, 170], [22, 110], [25, 50]]),
        P(22, 0, { corner: true, pocket: 'R' }),
      ],
      tuners: { mode: 'inline', a: [{ x: -14, y: 50 }, { x: -24, y: 200 }], side: 'L' },
    },
  },
  {
    id: 'headless',
    name: 'Headless (headpiece only)',
    angle: 0,
    shape: {
      points: [
        P(-22, 0, { corner: true, pocket: 'L' }),
        P(-26, 6),
        P(-27, 30, { corner: true }),
        P(27, 30, { corner: true }),
        P(26, 6),
        P(22, 0, { corner: true, pocket: 'R' }),
      ],
      tuners: { mode: 'none', a: [{ x: 0, y: 0 }, { x: 0, y: 0 }] },
    },
  },
]

export const HEADSTOCK_MAP = Object.fromEntries(HEADSTOCK_TEMPLATES.map((t) => [t.id, t]))

export function headstockTemplate(id: string): HeadstockTemplate {
  return HEADSTOCK_MAP[id] ?? HEADSTOCK_TEMPLATES[0]
}
