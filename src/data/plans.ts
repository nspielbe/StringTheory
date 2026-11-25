// Plan library: full-size SVG drawings (bodies, necks, fretboards, headstocks,
// inlays, rosettes and router templates) served from public/plans.
// Every file is at true scale: mmPerUnit converts SVG user units to millimetres.
// To add a plan, see tools/plans/README.md.

export type PlanCategory = 's-style' | 't-style' | 'offset' | 'gibson-style' | 'prs-style' | 'headless' | 'acoustic' | 'shop'
export type PlanKind = 'body' | 'neck' | 'fretboard' | 'headstock' | 'inlay' | 'rosette' | 'route' | 'full' | 'test'
/** [x, y, width, height] in the SVG's own user units. */
export type Box = [number, number, number, number]

export interface Plan {
  id: string
  title: string
  blurb: string
  category: PlanCategory
  kind: PlanKind
  /** Path under public/plans/. */
  file: string
  bytes: number
  /** Millimetres per SVG user unit (from the file's width/height and viewBox). */
  mmPerUnit: number
  /** Extent of the drawing. Some drawings sit partly or wholly off their page, so this can differ from the viewBox. */
  box: Box
  /** Tracing defaults: the part to centre on the outline (usually the body) and the rotation that points the neck up. */
  trace?: { focus?: Box; rot?: number }
}

export const PLAN_CATEGORIES: { id: PlanCategory; label: string }[] = [
  { id: 's-style', label: 'S-style' },
  { id: 't-style', label: 'T-style' },
  { id: 'offset', label: 'Offset' },
  { id: 'gibson-style', label: 'Gibson-style' },
  { id: 'prs-style', label: 'PRS-style' },
  { id: 'headless', label: 'Headless' },
  { id: 'acoustic', label: 'Acoustic' },
  { id: 'shop', label: 'Laser tests' },
]

export const PLAN_KINDS: { id: PlanKind; label: string; one: string }[] = [
  { id: 'body', label: 'Bodies', one: 'Body' },
  { id: 'full', label: 'Full plans', one: 'Full plan' },
  { id: 'neck', label: 'Necks', one: 'Neck' },
  { id: 'fretboard', label: 'Fretboards', one: 'Fretboard' },
  { id: 'headstock', label: 'Headstocks', one: 'Headstock' },
  { id: 'inlay', label: 'Inlays', one: 'Inlay' },
  { id: 'rosette', label: 'Rosettes', one: 'Rosette' },
  { id: 'route', label: 'Router templates', one: 'Router template' },
  { id: 'test', label: 'Test cuts', one: 'Test cut' },
]

export const PLANS: Plan[] = [
  {id: 's-full-cad', title: 'S-style full plan: front and back (CAD)', blurb: 'Front and back views with neck, frets, pickguard and routes. The S-style body, headstock and guard are traced from it.', category: 's-style', kind: 'full', file: 's-style/s-full-cad.svg', bytes: 504457, mmPerUnit: 1, box: [-77.9436, -4951.7183, 809.7054, 1037.8704], trace: {focus: [-27, -4398.1, 321.3, 464.3], rot: 0}},
  {id: 's-50s-cad', title: '’50s S-style plan: body and neck views (CAD)', blurb: 'Body front and back with routes, plus top and side views of the neck.', category: 's-style', kind: 'full', file: 's-style/s-50s-cad.svg', bytes: 121974, mmPerUnit: 1, box: [-388.2776, -1138.7362, 689.6623, 928.6745]},
  {id: 't-body-cad', title: 'T-style body and pickguard (CAD)', blurb: 'Body with neck pocket, bridge and string-through holes, plus the pickguard. The T-style body and guard are traced from it.', category: 't-style', kind: 'body', file: 't-style/t-body-cad.svg', bytes: 32899, mmPerUnit: 25.4, box: [-6.8813, 1.1753, 24.4511, 20.062], trace: {focus: [4.03, 3.85, 12.76, 15.96], rot: 0}},
  {id: 'lp-full-cad', title: 'LP-style full plan (CAD)', blurb: 'Body with routes, control cavity and switch, plus the neck and headstock with frets. The LP-style body and 3+3 headstock are traced from it.', category: 'gibson-style', kind: 'full', file: 'gibson-style/lp-full-cad.svg', bytes: 264454, mmPerUnit: 1, box: [717.6195, -526.2767, 1016.3236, 347.568], trace: {focus: [727.6, -516.3, 439.5, 327.6], rot: -90}},
  {id: 'sg-full-cad', title: 'SG-style full plan (CAD)', blurb: 'Body with pickguard, routes and controls, plus the neck and headstock with frets. The SG-style body is traced from it.', category: 'gibson-style', kind: 'full', file: 'gibson-style/sg-full-cad.svg', bytes: 317359, mmPerUnit: 1, box: [24.0762, -396.4243, 1036.6392, 360.7351], trace: {focus: [34.2, -386.3, 430.5, 340.4], rot: -90}},
  {id: 'reverse-full-cad', title: 'Reverse-body full plan (CAD)', blurb: 'Neck-through reverse body with three mini pickups, controls and the reverse headstock. The reverse-style body and headstock are traced from it.', category: 'gibson-style', kind: 'full', file: 'gibson-style/reverse-full-cad.svg', bytes: 72268, mmPerUnit: 1, box: [-213.9154, -2245.5009, 1137.1522, 373.7571], trace: {focus: [-202.8, -2234.4, 495.2, 351.5], rot: -90}},
  {id: 'v-58-plan', title: '1958 V-style plan', blurb: 'Body, neck and headstock with routes, string-through holes and the 12th-fret mark. Rendered from your PDF. The V-style body and headstock are traced from it.', category: 'gibson-style', kind: 'full', file: 'gibson-style/v-58-plan.svg', bytes: 575459, mmPerUnit: 1, box: [115, 37, 471, 1145], trace: {focus: [125, 620, 451, 552], rot: 0}},
  {id: 'x-76-plan', title: '1976 X-style plan', blurb: 'Body, neck and 6-in-line headstock with routes, controls and bridge studs. Rendered from your PDF. The X-style body and headstock are traced from it.', category: 'gibson-style', kind: 'full', file: 'gibson-style/x-76-plan.svg', bytes: 442219, mmPerUnit: 1, box: [28, 23, 1104, 453], trace: {focus: [38, 33, 452, 433], rot: -90}},
  {id: 'offset-body-routes', title: 'Offset body: routes and pickguard', blurb: 'Body with neck pocket and bolt holes, pickup routes, bridge posts and trem cavity, plus the pickguard. Rendered from your PDF. The offset body and guard are traced from it.', category: 'offset', kind: 'body', file: 'offset/offset-body-routes.svg', bytes: 468675, mmPerUnit: 1, box: [270, 130, 380, 970], trace: {focus: [281.6, 596.6, 351.2, 487.2], rot: 0}},
  {id: 's-body-full', title: 'S-style body: full template', blurb: 'Outline, pickup and control routes, pickguard, trem cavity and a cutting frame.', category: 's-style', kind: 'body', file: 's-style/s-body-full.svg', bytes: 121210, mmPerUnit: 1, box: [17.53, 120.28, 495.3, 373.09], trace: {focus: [36.6, 142.5, 460.5, 322.3], rot: -90}},
  {id: 's-body-neck-template', title: 'S-style body: routes and neck pocket', blurb: 'Outline with pickup, control and bridge routes and the neck pocket.', category: 's-style', kind: 'body', file: 's-style/s-body-neck-template.svg', bytes: 27118, mmPerUnit: 1, box: [-4.8, 6.47, 482.6, 322.26], trace: {focus: [7.9, 6.5, 467.4, 322.3], rot: -90}},
  {id: 's-neck-top', title: '’50s S-style neck: top view', blurb: 'Neck and headstock outline with fret lines, dots and tuner holes.', category: 's-style', kind: 'neck', file: 's-style/s-neck-top.svg', bytes: 11972, mmPerUnit: 0.264583, box: [24.92, 28.47, 1754.57, 1915.64], trace: {focus: [1253.1, 1369.4, 526.4, 574.7], rot: -135}},
  {id: 's-neck-side', title: '’50s S-style neck: side profile', blurb: 'Side view of the neck blank, fretboard and headstock.', category: 's-style', kind: 'neck', file: 's-style/s-neck-side.svg', bytes: 10610, mmPerUnit: 1, box: [6.31, 8.47, 543.85, 521.72]},
  {id: 's-neck-top-test', title: 'S-style neck: top view with test cut', blurb: 'Neck top view plus a small test piece for dialing in the laser.', category: 's-style', kind: 'neck', file: 's-style/s-neck-top-test.svg', bytes: 11971, mmPerUnit: 0.264583, box: [24.92, 28.47, 1754.57, 1915.64], trace: {focus: [1253.1, 1369.4, 526.4, 574.7], rot: -135}},
  {id: 's-fretboard-dots', title: 'S-style fretboard: slots and dots', blurb: 'Fret slots, outline and dot inlay pockets.', category: 's-style', kind: 'fretboard', file: 's-style/s-fretboard-dots.svg', bytes: 40082, mmPerUnit: 0.264583, box: [27.76, 132.95, 1834.94, 210.01]},
  {id: 's-fretboard-kokopelli', title: 'S-style fretboard: diamond and kokopelli inlays', blurb: 'Fret slots with diamond inlays and a kokopelli at the 7th fret.', category: 's-style', kind: 'fretboard', file: 's-style/s-fretboard-kokopelli.svg', bytes: 118455, mmPerUnit: 0.264583, box: [27.76, 132.95, 1834.94, 210.01]},
  {id: 's-inlays-kokopelli', title: 'Diamond and kokopelli inlay pieces', blurb: 'Just the inlay shapes from the S-style board, ready to cut from shell.', category: 's-style', kind: 'inlay', file: 's-style/s-inlays-kokopelli.svg', bytes: 113222, mmPerUnit: 0.264583, box: [78.83, 146.73, 1438.58, 184.11]},
  {id: 'laser-power-test', title: 'Laser power test card', blurb: 'Colour-coded squares for testing cut and engrave settings.', category: 'shop', kind: 'test', file: 'shop/laser-power-test.svg', bytes: 2767, mmPerUnit: 1, box: [5.61, 5.58, 46.52, 53.65]},
  {id: 't-body-neck', title: 'T-style body and neck', blurb: 'Body with routes and bridge holes, plus the neck and headstock.', category: 't-style', kind: 'body', file: 't-style/t-body-neck.svg', bytes: 40848, mmPerUnit: 1, box: [5.92, 3.19, 529.61, 611.38], trace: {focus: [5.9, 6.5, 324.1, 405.4], rot: 0}},
  {id: 't-neck-route-template', title: 'T-style neck pocket and bridge route template', blurb: 'Router template for the neck pocket and bridge pickup.', category: 't-style', kind: 'route', file: 't-style/t-neck-route-template.svg', bytes: 12635, mmPerUnit: 1, box: [7.6, 2.53, 527.93, 211.79]},
  {id: 't-neck-top', title: '’50s T-style neck: top view', blurb: 'Neck and headstock outline with fret lines and tuner holes.', category: 't-style', kind: 'neck', file: 't-style/t-neck-top.svg', bytes: 11593, mmPerUnit: 0.264583, box: [-5.81, -12.74, 1950.76, 1950.76], trace: {focus: [1359.7, 1352.8, 585.2, 585.2], rot: -135}},
  {id: 't-neck-top-final', title: '’50s T-style neck: top view (final)', blurb: 'Cleaned-up final version of the T-style neck.', category: 't-style', kind: 'neck', file: 't-style/t-neck-top-final.svg', bytes: 9757, mmPerUnit: 0.264583, box: [23.46, 394.19, 1878.67, 1805.34], trace: {focus: [1338.5, 1657.9, 563.6, 541.6], rot: -135}},
  {id: 't-fretboard-kokopelli', title: 'T-style fretboard: diamond and kokopelli inlays', blurb: 'Fret slots, headstock outline and inlays.', category: 't-style', kind: 'fretboard', file: 't-style/t-fretboard-kokopelli.svg', bytes: 314413, mmPerUnit: 0.264583, box: [-192.01, 816.95, 2454.53, 556.83]},
  {id: 't-fretboard-flower', title: 'T-style fretboard: flower inlay', blurb: 'Fret slots with a flower inlay at the 12th fret.', category: 't-style', kind: 'fretboard', file: 't-style/t-fretboard-flower.svg', bytes: 51226, mmPerUnit: 0.264583, box: [73.6, 10.71, 1844.74, 285.74]},
  {id: 't-inlay-flower', title: 'Flower inlay piece', blurb: 'The flower inlay on its own.', category: 't-style', kind: 'inlay', file: 't-style/t-inlay-flower.svg', bytes: 46700, mmPerUnit: 0.264583, box: [566.79, 56.06, 187.38, 164.8]},
  {id: 'prs-body', title: 'PRS-style body: routes and trem cavity', blurb: 'Body outline, carve line, pickup and control routes and the trem cavity.', category: 'prs-style', kind: 'body', file: 'prs-style/prs-body.svg', bytes: 665966, mmPerUnit: 0.264583, box: [39.35, 1211.87, 3170.86, 1248], trace: {focus: [92.1, 1211.9, 1694.8, 1248], rot: -90}},
  {id: 'prs-body-front', title: 'PRS-style body: front, routes and carve line', blurb: 'Top outline, pickup and control routes and the carve line.', category: 'prs-style', kind: 'body', file: 'prs-style/prs-body-front.svg', bytes: 404067, mmPerUnit: 0.264583, box: [-20.91, 29.94, 3231.12, 1925.62], trace: {focus: [31.9, 29.9, 1694.8, 1248], rot: -90}},
  {id: 'prs-body-back', title: 'PRS-style body: back and neck', blurb: 'Back outline with control cavity, plus the neck.', category: 'prs-style', kind: 'body', file: 'prs-style/prs-body-back.svg', bytes: 13010, mmPerUnit: 1, box: [-40.76, -26.85, 672.98, 645.19], trace: {focus: [43.9, 178.4, 588.4, 439.9], rot: -62}},
  {id: 'prs-body-hairline', title: 'PRS-style full plan: top and side views', blurb: 'Body, neck and headstock from the top, a side view and a spec table, in hairline strokes.', category: 'prs-style', kind: 'full', file: 'prs-style/prs-body-hairline.svg', bytes: 693071, mmPerUnit: 0.264583, box: [23.66, 1196.37, 3790.93, 1968.59], trace: {focus: [92.1, 1211.9, 1694.8, 1248], rot: -90}},
  {id: 'prs-body-hairline-full', title: 'PRS-style full plan: top and side views (alt file)', blurb: 'Same drawing as the plan above, saved as a separate file.', category: 'prs-style', kind: 'full', file: 'prs-style/prs-body-hairline-full.svg', bytes: 692878, mmPerUnit: 0.264583, box: [23.66, 1196.37, 3790.93, 1968.59], trace: {focus: [92.1, 1211.9, 1694.8, 1248], rot: -90}},
  {id: 'prs-body-neck-head', title: 'PRS-style body, neck and headstock', blurb: 'Body with routes and carve line, neck and headstock.', category: 'prs-style', kind: 'full', file: 'prs-style/prs-body-neck-head.svg', bytes: 413800, mmPerUnit: 0.264583, box: [31.88, 29.94, 2241.73, 2219.74], trace: {focus: [31.9, 29.9, 1694.8, 1248], rot: -90}},
  {id: 'prs-body-neck-head-outline', title: 'PRS-style body, neck and headstock (outlines)', blurb: 'Same layout as above, outlines only.', category: 'prs-style', kind: 'full', file: 'prs-style/prs-body-neck-head-outline.svg', bytes: 410754, mmPerUnit: 0.264583, box: [31.88, 29.94, 2241.73, 2219.74], trace: {focus: [31.9, 29.9, 1694.8, 1248], rot: -90}},
  {id: 'prs-fretboard-birds', title: 'PRS-style fretboard: slots and bird inlays', blurb: 'Fret slots with bird inlay pockets.', category: 'prs-style', kind: 'fretboard', file: 'prs-style/prs-fretboard-birds.svg', bytes: 46204, mmPerUnit: 1, box: [4.63, 5.08, 485.77, 57.15]},
  {id: 'prs-inlays-birds', title: 'Bird inlay pieces', blurb: 'The bird inlays on their own.', category: 'prs-style', kind: 'inlay', file: 'prs-style/prs-inlays-birds.svg', bytes: 39671, mmPerUnit: 1, box: [9.54, 15.77, 480.86, 35.6]},
  {id: 'prs-fretboard-outline', title: 'PRS-style fretboard outline', blurb: 'Fretboard outline only.', category: 'prs-style', kind: 'fretboard', file: 'prs-style/prs-fretboard-outline.svg', bytes: 1782, mmPerUnit: 1, box: [4.63, 5.08, 485.77, 57.15]},
  {id: 'headless-full-plan', title: 'Strandberg-style headless 6: full plan', blurb: 'Front, back and side elevations with hardware.', category: 'headless', kind: 'full', file: 'headless/headless-full-plan.svg', bytes: 1339101, mmPerUnit: 0.264583, box: [18, 17.09, 6021.03, 3091], trace: {focus: [140.9, 191.2, 1612.1, 1178.2], rot: -90}},
  {id: 'headless-body-fabric', title: 'Strandberg-style body: top template', blurb: 'Body outline with pickup routes, for a fabric or veneer top.', category: 'headless', kind: 'body', file: 'headless/headless-body-fabric.svg', bytes: 19436, mmPerUnit: 0.264583, box: [575.31, 226.15, 2623.56, 2389.53], trace: {focus: [575.3, 226.2, 1586.9, 1163.4], rot: -90}},
  {id: 'headless-body-neck', title: 'Strandberg-style body and neck outlines', blurb: 'Body with routes and control holes, plus the neck.', category: 'headless', kind: 'body', file: 'headless/headless-body-neck.svg', bytes: 36838, mmPerUnit: 0.264583, box: [23.34, 35.36, 3175.53, 2580.32], trace: {focus: [23.3, 35.4, 1163.4, 1586.9], rot: 0}},
  {id: 'headless-body-neck-routing', title: 'Strandberg-style body: neck routing', blurb: 'Body outline with the neck pocket route.', category: 'headless', kind: 'body', file: 'headless/headless-body-neck-routing.svg', bytes: 19850, mmPerUnit: 0.264583, box: [187.61, 197.79, 3011.26, 2417.89], trace: {focus: [187.6, 197.8, 1586.9, 1163.4], rot: -90}},
  {id: 'headless-body-top-cutoff', title: 'Strandberg-style body: top cut-off', blurb: 'Body outline with the top trimmed for the neck.', category: 'headless', kind: 'body', file: 'headless/headless-body-top-cutoff.svg', bytes: 17728, mmPerUnit: 0.264583, box: [93.88, 147.13, 1586.89, 1163.42], trace: {focus: [93.9, 147.1, 1586.9, 1163.4], rot: -90}},
  {id: 'headless-fretboard', title: 'Headless fretboard', blurb: 'Fretboard outline with fret slots and side dots.', category: 'headless', kind: 'fretboard', file: 'headless/headless-fretboard.svg', bytes: 48452, mmPerUnit: 1, box: [2.78, 4.36, 532.84, 54.69]},
  {id: 'headless-fretboard-dots', title: 'Headless fretboard dot inlays', blurb: 'A sheet of dot inlay pieces for the headless board.', category: 'headless', kind: 'inlay', file: 'headless/headless-fretboard-dots.svg', bytes: 29306, mmPerUnit: 1, box: [115.37, 79.82, 78.84, 74.05]},
  {id: 'dread-body-plan', title: 'Dreadnought body plan', blurb: 'Full-size plan with bracing, rosette and dimensions.', category: 'acoustic', kind: 'full', file: 'acoustic/dread-body-plan.svg', bytes: 1933884, mmPerUnit: 0.264583, box: [0, -0.53, 2872.32, 2661.12]},
  {id: 'dread-top-bracing', title: 'Dreadnought top: bracing templates', blurb: 'Top outlines with brace layouts and soundhole, split into modules for cutting.', category: 'acoustic', kind: 'full', file: 'acoustic/dread-top-bracing.svg', bytes: 7899049, mmPerUnit: 0.264583, box: [-7905.69, -1753.26, 11275.47, 4362.64], trace: {focus: [-6267.5, 413.9, 1503.6, 1908], rot: 0}},
  {id: 'dread-headstock', title: 'Dreadnought headstock', blurb: 'Headstock outline with tuner holes.', category: 'acoustic', kind: 'headstock', file: 'acoustic/dread-headstock.svg', bytes: 175449, mmPerUnit: 0.264583, box: [64.63, 52.91, 654.04, 355.44], trace: {rot: 76.5}},
  {id: 'dread-headstock-logo', title: 'Dreadnought headstock: logo and fleur inlay', blurb: 'Headstock with script logo and fleur-de-lis inlay.', category: 'acoustic', kind: 'headstock', file: 'acoustic/dread-headstock-logo.svg', bytes: 237618, mmPerUnit: 0.264583, box: [64.63, 52.91, 654.04, 355.44], trace: {rot: 76.5}},
  {id: 'dread-headstock-logo-laser', title: 'Dreadnought headstock: logo, laser cut', blurb: 'Cut-ready version of the logo headstock.', category: 'acoustic', kind: 'headstock', file: 'acoustic/dread-headstock-logo-laser.svg', bytes: 155336, mmPerUnit: 0.264583, box: [-49.58, -120.23, 711.85, 492.21], trace: {rot: 90}},
  {id: 'dread-headstock-logo-abalone', title: 'Dreadnought headstock: abalone pieces', blurb: 'Logo and fleur pieces to cut from abalone.', category: 'acoustic', kind: 'inlay', file: 'acoustic/dread-headstock-logo-abalone.svg', bytes: 64270, mmPerUnit: 0.264583, box: [7.07, -2.71, 212.8, 230.99]},
  {id: 'dread-rosette-pearl', title: 'Dreadnought rosette: pearl side', blurb: 'Rosette ring, mother-of-pearl pieces.', category: 'acoustic', kind: 'rosette', file: 'acoustic/dread-rosette-pearl.svg', bytes: 2013041, mmPerUnit: 1, box: [9.64, 10.33, 133.09, 133.09]},
  {id: 'dread-rosette-wood', title: 'Dreadnought rosette: wood side', blurb: 'Rosette ring, wood channel.', category: 'acoustic', kind: 'rosette', file: 'acoustic/dread-rosette-wood.svg', bytes: 2013630, mmPerUnit: 1, box: [5.54, 6.21, 133.09, 133.09]},
  {id: 'dread-rosette', title: 'Dreadnought rosette', blurb: 'Rosette ring with inlay segments.', category: 'acoustic', kind: 'rosette', file: 'acoustic/dread-rosette.svg', bytes: 4768756, mmPerUnit: 1, box: [2.61, 4.94, 128.9, 128.9]},
  {id: 'dread-rosette-abalone', title: 'Dreadnought rosette: abalone', blurb: 'Rosette ring cut for abalone.', category: 'acoustic', kind: 'rosette', file: 'acoustic/dread-rosette-abalone.svg', bytes: 5640018, mmPerUnit: 1, box: [4.09, 4.35, 128.9, 128.9]},
  {id: 'dread-top-soundhole', title: 'Dreadnought top: soundhole and rosette channel', blurb: 'Top outline with soundhole and rosette channel.', category: 'acoustic', kind: 'full', file: 'acoustic/dread-top-soundhole.svg', bytes: 3205, mmPerUnit: 1, box: [4.57, 13.52, 397.83, 504.83]},
  {id: 'dread-top-fleur-rosette', title: 'Dreadnought top: fleur rosette', blurb: 'Top with a fleur-de-lis rosette ring.', category: 'acoustic', kind: 'full', file: 'acoustic/dread-top-fleur-rosette.svg', bytes: 3829276, mmPerUnit: 1, box: [0, 0, 449.26, 518.83]},
  {id: 'acoustic-kit-top', title: 'Acoustic top outline: fitting tests', blurb: 'Three copies of the top outline with test windows.', category: 'acoustic', kind: 'full', file: 'acoustic/acoustic-kit-top.svg', bytes: 5077, mmPerUnit: 1, box: [-1008.65, -538.41, 2700.91, 1136.08], trace: {focus: [-844.2, -373.1, 400.1, 510.9], rot: 0}},
  {id: 'acoustic-kit-top-final', title: 'Acoustic top outline (final)', blurb: 'Final top outlines.', category: 'acoustic', kind: 'full', file: 'acoustic/acoustic-kit-top-final.svg', bytes: 2901, mmPerUnit: 1, box: [67.85, 38.37, 1624.4, 559.3], trace: {focus: [67.9, 38.4, 399.9, 510.8], rot: 0}},
  {id: 'acoustic-endpiece-inlay', title: 'End-piece fleur inlay', blurb: 'Tapered end piece with a fleur-de-lis.', category: 'acoustic', kind: 'inlay', file: 'acoustic/acoustic-endpiece-inlay.svg', bytes: 56056, mmPerUnit: 1, box: [20.41, 5.01, 76.2, 114.3]},
  {id: 'acoustic-endpiece-template', title: 'End-piece inlay template', blurb: 'Routing template for the end piece.', category: 'acoustic', kind: 'route', file: 'acoustic/acoustic-endpiece-template.svg', bytes: 2009, mmPerUnit: 1, box: [26.66, 47.42, 222.62, 209.9]},
  {id: 'fleur-pattern', title: 'Fleur-de-lis pattern sheet', blurb: 'A grid of fleur-de-lis pieces.', category: 'acoustic', kind: 'inlay', file: 'acoustic/fleur-pattern.svg', bytes: 113395, mmPerUnit: 1, box: [-0.11, 0.02, 80.64, 21.54]},
  {id: 'acoustic-rosette-insert', title: 'Rosette insert', blurb: 'Rosette insert ring.', category: 'acoustic', kind: 'rosette', file: 'acoustic/acoustic-rosette-insert.svg', bytes: 1820, mmPerUnit: 1, box: [6.88, 8.47, 160.85, 134.82]},
  {id: 'acoustic-inside-top-plug', title: 'Inside top plug', blurb: 'Circular plug for the inside of the top.', category: 'acoustic', kind: 'route', file: 'acoustic/acoustic-inside-top-plug.svg', bytes: 1564, mmPerUnit: 1, box: [197.81, 121.33, 122.61, 122.61]},
  {id: 'fleur-test', title: 'Fleur inlay test', blurb: 'Small fleur-de-lis test cut.', category: 'shop', kind: 'test', file: 'shop/fleur-test.svg', bytes: 55940, mmPerUnit: 1, box: [3.63, 5.16, 8.97, 9]},
  {id: 'fleur-cut-test', title: 'Fleur inlay cut test', blurb: 'Fleur-de-lis cut test.', category: 'shop', kind: 'test', file: 'shop/fleur-cut-test.svg', bytes: 148262, mmPerUnit: 1, box: [0.91, 1.6, 28.13, 8.97]},
]

export const planById = (id: string) => PLANS.find((p) => p.id === id)
export const planUrl = (p: Plan) => `${import.meta.env.BASE_URL}plans/${p.file}`
export const planThumb = (p: Plan) => `${import.meta.env.BASE_URL}plans/thumbs/${p.id}.png`
/** Size of the drawing in millimetres. */
export const planSizeMm = (p: Plan) => ({ w: p.box[2] * p.mmPerUnit, h: p.box[3] * p.mmPerUnit })

/** Which plans each outline editor offers as a tracing reference. */
export function plansForEditor(kind: 'body' | 'head' | 'guard'): Plan[] {
  const kinds: PlanKind[] = kind === 'head' ? ['headstock', 'neck'] : ['body', 'full']
  return PLANS.filter((p) => kinds.includes(p.kind))
}
