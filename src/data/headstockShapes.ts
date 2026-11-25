import type { HeadstockShapeData, ShapePoint } from '../types'

// Headstock outlines in headstock space: y = 0 at the nut, +y away from the
// body, bass side at -x. `pocket` points snap to the neck width at the nut.
// Each outline and its tuner holes are traced from a plan in the plan library
// (see `source`) with tools/body-sources.

export interface HeadstockTemplate {
  id: string
  name: string
  shape: HeadstockShapeData
  angle: number
  /** Plan in the library this outline was traced from. */
  source: { plan: string; note: string }
}

const P = (x: number, y: number, o: Partial<ShapePoint> = {}): ShapePoint => ({ x, y, ...o })
/** Mixed list of P(...) points and plain [x, y] tuples (traced outlines). */
const M = (...items: (ShapePoint | [number, number])[]): ShapePoint[] => items.map((q) => (Array.isArray(q) ? P(q[0], q[1]) : q))

export const HEADSTOCK_TEMPLATES: HeadstockTemplate[] = [
  {
    id: 'fender-6',
    name: 'Fender-style 6-in-line',
    angle: 0,
    source: { plan: 's-full-cad', note: 'S-style CAD; tuner holes from the drawing' },
    shape: {
      points: M(P(-21.2, 0, { corner: true, pocket: 'L' }), [-21.4, 12.0], [-25.4, 18.8], [-26.9, 20.0], [-27.5, 19.8], [-33.0, 24.6], [-34.8, 29.0], [-34.4, 34.4], [-28.9, 53.8], [-23.0, 73.0], [-17.1, 92.2], [-11.0, 111.5], [-5.1, 130.9], [0.7, 149.8], [5.5, 165.5], [5.6, 169.4], [7.1, 170.3], [8.6, 173.5], [11.1, 177.1], [19.2, 183.5], [25.9, 185.9], [38.7, 185.0], [48.8, 178.8], [53.6, 172.0], [56.1, 163.2], [54.8, 152.3], [48.2, 142.0], [41.6, 137.5], [34.8, 132.2], [34.9, 120.8], [38.6, 101.0], [43.5, 81.4], [47.0, 61.6], [47.3, 50.9], [45.1, 49.2], [39.9, 44.9], [35.3, 40.5], [27.0, 29.3], [23.4, 22.2], [21.5, 10.1], P(21.1, 0, { corner: true, pocket: 'R' })),
      tuners: { mode: 'inline', a: [{ x: -20.27, y: 41.96 }, { x: 15.66, y: 158.89 }], side: 'L' },
    },
  },
  {
    id: 'tele-6',
    name: 'Fender-style T 6-in-line',
    angle: 0,
    source: { plan: 't-neck-top-final', note: 'Your T-style neck laser file (mirrored to the front); tuner holes from the file' },
    shape: {
      points: M(P(-21.0, 0, { corner: true, pocket: 'L' }), [-21.0, 6.7], [-21.9, 10.5], [-24.3, 15.1], [-27.5, 18.1], [-35.9, 25.4], [-36.8, 30.0], [-35.7, 34.2], [-29.7, 53.6], [-23.8, 73.0], [-17.8, 92.5], [-11.9, 111.9], [-5.9, 131.3], [-0.0, 150.8], [-0.0, 152.8], [0.8, 153.4], [1.4, 155.3], [5.8, 169.8], [9.9, 178.7], [19.2, 182.6], [28.3, 181.2], [36.9, 175.0], [40.9, 167.7], [41.5, 156.0], [37.7, 147.3], [31.4, 138.6], [30.0, 129.3], [34.0, 119.4], [36.8, 111.9], [38.8, 99.8], [38.7, 90.3], [36.5, 79.9], [29.2, 61.0], [23.0, 41.6], [20.8, 21.6], [21.2, 1.2], P(21.2, 0, { corner: true, pocket: 'R' })),
      tuners: { mode: 'inline', a: [{ x: -20.27, y: 42.75 }, { x: 14.82, y: 157.58 }], side: 'L' },
    },
  },
  {
    id: 'gibson-33',
    name: 'Gibson-style 3+3 open book',
    angle: 14,
    source: { plan: 'lp-full-cad', note: 'LP-style CAD; tuner holes from the drawing' },
    shape: {
      points: M(P(-21.6, 0, { corner: true, pocket: 'L' }), [-22.2, 20.0], [-24.5, 30.1], [-29.0, 38.9], [-33.1, 44.2], [-34.7, 46.0], [-34.6, 50.4], [-34.4, 57.1], [-33.9, 77.5], [-33.9, 97.5], [-34.4, 117.8], [-35.6, 138.0], [-37.1, 158.1], P(-38.4, 172.7, { corner: true }), [-32.9, 172.2], [-23.1, 173.4], [-13.6, 177.2], [-6.9, 179.7], [-3.3, 179.4], P(-0.1, 177.9, { corner: true }), [5.4, 179.7], [24.4, 173.1], [30.3, 172.2], P(38.6, 172.6, { corner: true }), [38.0, 166.7], [36.2, 146.6], [34.9, 126.4], [34.1, 106.1], [33.9, 85.8], [34.1, 65.4], [34.7, 45.9], [34.2, 45.3], [33.1, 44.2], [30.1, 40.5], [23.9, 28.1], [21.6, 14.0], [21.6, 8.0], P(21.6, 0, { corner: true, pocket: 'R' })),
      tuners: { mode: 'split', a: [{ x: -21.93, y: 71.18 }, { x: -23.95, y: 141.21 }], b: [{ x: 21.93, y: 71.18 }, { x: 23.95, y: 141.21 }] },
    },
  },
  {
    id: 'prs-33',
    name: 'PRS-style 3+3',
    angle: 10,
    source: { plan: 'prs-body-hairline', note: 'PRS-style full plan; tuner centres from its crosshairs' },
    shape: {
      points: M(P(-21.1, 0, { corner: true, pocket: 'L' }), [-21.4, 7.3], [-24.7, 19.5], [-31.4, 29.8], [-37.6, 34.8], [-41.1, 36.8], [-41.7, 39.4], [-39.7, 43.2], [-35.8, 51.4], [-30.0, 70.8], [-26.7, 90.7], [-25.1, 110.8], [-24.7, 131.2], [-24.9, 146.4], [-25.2, 151.5], P(-24.4, 153.7, { corner: true }), [-22.3, 153.1], [-18.8, 149.3], [-10.8, 142.7], [0.6, 138.3], [8.5, 137.8], [19.8, 139.9], [23.7, 141.7], P(24.9, 141.6, { corner: true }), [25.6, 140.7], [25.8, 138.7], [25.5, 133.9], [25.1, 118.4], [25.9, 98.1], [28.5, 78.2], [33.5, 58.6], [38.8, 45.7], [41.7, 40.1], [41.1, 36.7], [36.7, 34.1], [28.1, 26.5], [23.6, 18.6], [21.3, 7.8], P(21.3, 0, { corner: true, pocket: 'R' })),
      tuners: { mode: 'split', a: [{ x: -20.9, y: 50.01 }, { x: -9.26, y: 116.15 }], b: [{ x: 21.17, y: 50.01 }, { x: 9.26, y: 116.15 }] },
    },
  },
  {
    id: 'v-33',
    name: 'V-style 3+3',
    angle: 14,
    source: { plan: 'v-58-plan', note: '1958 V-style plan; tuner holes from the drawing' },
    shape: {
      points: M(P(-21.6, 0, { corner: true, pocket: 'L' }), [-22.3, 8.0], [-26.3, 19.2], [-32.4, 28.0], [-39.7, 34.2], P(-50.9, 39.9, { corner: true }), [-49.1, 47.2], [-43.7, 66.8], [-38.2, 86.3], [-32.8, 105.8], [-27.4, 125.3], [-22.0, 144.8], [-16.6, 164.4], [-12.6, 178.1], [-9.1, 182.9], [1.0, 186.2], [9.5, 182.3], [12.5, 178.2], [16.7, 163.7], [22.1, 144.1], [27.5, 124.6], [32.9, 105.1], [38.3, 85.6], [43.8, 66.1], [49.2, 46.5], P(50.8, 39.7, { corner: true }), [39.0, 33.9], [31.4, 27.0], [25.9, 18.7], [22.1, 7.5], P(21.5, 0, { corner: true, pocket: 'R' })),
      tuners: { mode: 'split', a: [{ x: -32.17, y: 59.1 }, { x: -15.33, y: 120.6 }], b: [{ x: 32.17, y: 59.1 }, { x: 15, y: 120.77 }] },
    },
  },
  {
    id: 'hockey-6',
    name: 'X-style 6-in-line',
    angle: 14,
    source: { plan: 'x-76-plan', note: '1976 X-style plan; tuner holes from the drawing' },
    shape: {
      points: M(P(-21.5, 0, { corner: true, pocket: 'L' }), [-23.2, 7.7], [-28.8, 18.6], [-37.4, 28.0], [-43.6, 32.3], [-47.6, 34.2], [-48.3, 35.9], [-46.6, 39.0], [-40.6, 47.5], [-28.8, 64.1], [-17.0, 80.7], [-5.3, 97.3], [6.4, 113.9], [18.2, 130.5], [30.0, 147.1], [42.7, 163.0], [59.5, 174.0], [79.1, 178.7], [90.0, 175.6], [94.0, 168.2], [91.7, 159.8], [85.0, 150.4], [73.6, 133.6], [63.1, 116.2], [53.4, 98.5], [44.6, 80.2], [36.9, 61.5], [30.4, 42.2], [25.5, 22.6], [22.0, 2.8], P(21.5, 0, { corner: true, pocket: 'R' })),
      tuners: { mode: 'inline', a: [{ x: -22.92, y: 48.08 }, { x: 43.33, y: 141.75 }], side: 'L' },
    },
  },
  {
    id: 'reverse-6',
    name: 'Gibson-style reverse 6-in-line',
    angle: 14,
    source: { plan: 'reverse-full-cad', note: 'Reverse-body CAD; tuner holes from the drawing' },
    shape: {
      points: M(P(-21.6, 0, { corner: true, pocket: 'L' }), [-21.6, 20.1], [-22.9, 29.9], [-27.0, 39.4], [-33.6, 47.8], [-36.9, 50.6], [-38.2, 51.6], [-38.1, 55.2], [-36.2, 75.3], [-34.4, 95.4], [-32.6, 115.5], [-30.7, 135.6], [-28.9, 155.7], [-27.7, 175.8], [-32.4, 187.5], [-37.2, 193.3], [-42.2, 197.3], [-44.5, 198.7], [-43.1, 209.7], [-38.8, 217.7], [-30.4, 224.9], [-22.6, 227.8], [-10.8, 227.7], [-1.0, 223.4], [5.7, 216.6], [9.8, 208.0], [12.1, 197.6], [16.6, 177.9], [21.1, 158.3], [25.6, 138.6], [30.1, 118.9], [34.6, 99.2], [39.3, 79.6], [46.5, 60.6], P(47.1, 58.8, { corner: true }), [33.7, 46.4], [24.2, 28.6], [21.9, 17.0], [21.8, 8.6], P(21.6, 0, { corner: true, pocket: 'R' })),
      tuners: { mode: 'inline', a: [{ x: 19.07, y: 58.36 }, { x: -12.53, y: 204.29 }], side: 'R' },
    },
  },
  {
    id: 'headless',
    name: 'Headless (headpiece only)',
    angle: 0,
    source: { plan: 'headless-full-plan', note: 'Headless full plan: the string clamp block beyond the nut' },
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
