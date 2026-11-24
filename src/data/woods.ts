// Tonewood species: how each one looks (drives the procedural grain), its
// density (for weight estimates) and where to buy it for each part.

export type FigureType = 'none' | 'flame' | 'quilt' | 'birdseye' | 'spalted' | 'burl' | 'ribbon' | 'stripe'

export interface WoodLook {
  light: string
  dark: string
  /** Grain lines per 10 mm. */
  grainFreq: number
  grainContrast: number
  /** Cathedral arches (flat-sawn look) 0..1. */
  cathedral: number
  waviness: number
  pores: number
  poreContrast: number
  figure: FigureType
  figureStrength: number
  figureScale: number
  hueVariation: number
  /** Overall brightness noise (colour streaks). */
  streaks: number
}

export type WoodUse = 'body' | 'top' | 'neck' | 'fretboard' | 'headplate'

export interface Wood {
  id: string
  name: string
  /** kg / m³ */
  density: number
  /** Open-grain woods need grain filler under gloss finishes. */
  openGrain: boolean
  look: WoodLook
  uses: Partial<Record<WoodUse, string[]>>
  blurb: string
}

const base: WoodLook = {
  light: '#e8cfa0',
  dark: '#b8915c',
  grainFreq: 1.4,
  grainContrast: 0.35,
  cathedral: 0.3,
  waviness: 0.4,
  pores: 0,
  poreContrast: 0,
  figure: 'none',
  figureStrength: 0,
  figureScale: 1,
  hueVariation: 0.08,
  streaks: 0.15,
}

const look = (o: Partial<WoodLook>): WoodLook => ({ ...base, ...o })

export const WOODS: Wood[] = [
  {
    id: 'alder', name: 'Alder', density: 450, openGrain: false,
    look: look({ light: '#e7c9a0', dark: '#c49a6c', grainFreq: 0.9, grainContrast: 0.22, cathedral: 0.5, waviness: 0.5 }),
    uses: { body: ['sm-alder-body', 'ewz-alder-body'] },
    blurb: 'Light, balanced, the classic choice under solid colours and bursts.',
  },
  {
    id: 'swamp-ash', name: 'Swamp Ash', density: 480, openGrain: true,
    look: look({ light: '#ecd9b4', dark: '#a8865a', grainFreq: 0.8, grainContrast: 0.6, cathedral: 0.85, waviness: 0.5, pores: 0.6, poreContrast: 0.5 }),
    uses: { body: ['sm-swampash-body'] },
    blurb: 'Bold cathedral grain that shows through translucent finishes.',
  },
  {
    id: 'white-ash', name: 'White Ash', density: 640, openGrain: true,
    look: look({ light: '#eedfc0', dark: '#a98a5e', grainFreq: 0.9, grainContrast: 0.65, cathedral: 0.8, waviness: 0.4, pores: 0.7, poreContrast: 0.55 }),
    uses: { body: ['ewz-whiteash-body'], headplate: ['ewz-hp-ash'] },
    blurb: 'Heavier, brighter ash with strong grain.',
  },
  {
    id: 'african-mahogany', name: 'African Mahogany (Khaya)', density: 530, openGrain: true,
    look: look({ light: '#b26a43', dark: '#7a3d22', grainFreq: 1.6, grainContrast: 0.3, cathedral: 0.1, waviness: 0.3, pores: 0.8, poreContrast: 0.35, figure: 'ribbon', figureStrength: 0.25, figureScale: 1.2 }),
    uses: { body: ['sm-afmahog-body', 'ewz-afmahog-body'], neck: ['sm-afmahog-neck', 'ewz-mahog-neck'], headplate: ['ewz-hp-mahog'] },
    blurb: 'Warm and resonant; the go-to for set necks and single-cut bodies.',
  },
  {
    id: 'honduran-mahogany', name: 'Honduran Mahogany', density: 590, openGrain: true,
    look: look({ light: '#a95b35', dark: '#6b311a', grainFreq: 1.7, grainContrast: 0.32, cathedral: 0.1, waviness: 0.3, pores: 0.8, poreContrast: 0.4, figure: 'ribbon', figureStrength: 0.2 }),
    uses: { body: ['sm-hmahog-body'], neck: ['sm-hmahog-neck'] },
    blurb: 'Genuine mahogany: deep red-brown, fine ribbon figure.',
  },
  {
    id: 'basswood', name: 'Basswood', density: 415, openGrain: false,
    look: look({ light: '#efe3c8', dark: '#d8c59f', grainFreq: 0.7, grainContrast: 0.12, cathedral: 0.2, waviness: 0.3, streaks: 0.08 }),
    uses: { body: ['ewz-basswood-body', 'sm-basswood-body'] },
    blurb: 'Light, even and easy to carve; ideal under solid paint.',
  },
  {
    id: 'poplar', name: 'Poplar', density: 450, openGrain: false,
    look: look({ light: '#e6dcb8', dark: '#9da27a', grainFreq: 0.8, grainContrast: 0.18, cathedral: 0.3, streaks: 0.4, hueVariation: 0.2 }),
    uses: { body: ['sm-poplar-paint-body', 'sm-poplar-body', 'ewz-poplar-body'] },
    blurb: 'Budget body wood with green/brown streaks; best painted.',
  },
  {
    id: 'black-limba', name: 'Black Limba (Korina)', density: 550, openGrain: true,
    look: look({ light: '#c9a679', dark: '#4a3826', grainFreq: 1.0, grainContrast: 0.45, cathedral: 0.4, waviness: 0.6, pores: 0.5, poreContrast: 0.3, figure: 'stripe', figureStrength: 0.55, figureScale: 1.5, streaks: 0.5 }),
    uses: { body: ['ewz-blimba-body', 'sm-blimba-body'], top: ['ewz-blimba-drop'], fretboard: ['ewz-fb-blimba'], headplate: ['ewz-hp-blimba'] },
    blurb: 'Golden with dramatic dark streaks.',
  },
  {
    id: 'white-limba', name: 'White Limba (Korina)', density: 550, openGrain: true,
    look: look({ light: '#e6cf9a', dark: '#bf9e64', grainFreq: 1.2, grainContrast: 0.3, cathedral: 0.2, pores: 0.5, poreContrast: 0.25 }),
    uses: { body: ['sm-korina-body'], neck: ['ewz-wlimba-neck'] },
    blurb: 'The vintage V / X-style wood: light gold and resonant.',
  },
  {
    id: 'hard-maple', name: 'Hard Maple', density: 705, openGrain: false,
    look: look({ light: '#f1e1bf', dark: '#d9bf8f', grainFreq: 1.6, grainContrast: 0.18, cathedral: 0.15, waviness: 0.25, streaks: 0.1 }),
    uses: { body: ['ewz-maple-body'], neck: ['sm-maple-neck', 'ewz-maple-neck', 'sm-maple-neck-wide'], fretboard: ['ewz-fb-maple', 'sm-fb-unslotted'], top: ['ewz-maple-carved-plain'] },
    blurb: 'Stiff, bright and stable: necks, boards and caps.',
  },
  {
    id: 'roasted-maple', name: 'Roasted (Torrefied) Maple', density: 650, openGrain: false,
    look: look({ light: '#c98f55', dark: '#8f5a2e', grainFreq: 1.6, grainContrast: 0.25, cathedral: 0.15, waviness: 0.25, figure: 'flame', figureStrength: 0.2 }),
    uses: { neck: ['sm-roasted-neck'], fretboard: ['sm-fb-unslotted'] },
    blurb: 'Caramel colour, extra stable thanks to the roasting.',
  },
  {
    id: 'flame-maple', name: 'Flame Maple', density: 650, openGrain: false,
    look: look({ light: '#f2dfb5', dark: '#c9a46a', grainFreq: 1.5, grainContrast: 0.15, cathedral: 0.1, figure: 'flame', figureStrength: 0.85, figureScale: 1 }),
    uses: { top: ['ewz-flame-drop', 'ewz-flame-carved'], neck: ['ewz-flame-neck'], fretboard: ['ewz-fb-flame'], headplate: ['ewz-hp-flame'] },
    blurb: 'Tiger-stripe figure that pops under dyes and bursts.',
  },
  {
    id: 'quilted-maple', name: 'Quilted Maple', density: 600, openGrain: false,
    look: look({ light: '#f0dcb0', dark: '#c19a60', grainFreq: 1.2, grainContrast: 0.12, cathedral: 0.1, figure: 'quilt', figureStrength: 0.9, figureScale: 1 }),
    uses: { top: ['ewz-quilt-drop', 'ewz-quilt-carved'] },
    blurb: 'Rippling, 3D "bubble" figure.',
  },
  {
    id: 'birdseye-maple', name: 'Birdseye Maple', density: 700, openGrain: false,
    look: look({ light: '#f3e3c2', dark: '#c8a676', grainFreq: 1.4, grainContrast: 0.15, figure: 'birdseye', figureStrength: 0.8, figureScale: 1 }),
    uses: { top: ['ewz-birdseye-drop'], neck: ['ewz-birdseye-neck'] },
    blurb: 'Tiny eye-shaped figure across the board.',
  },
  {
    id: 'ambrosia-maple', name: 'Flame Ambrosia Maple', density: 580, openGrain: false,
    look: look({ light: '#e9d2a8', dark: '#8a7458', grainFreq: 1.2, grainContrast: 0.2, figure: 'flame', figureStrength: 0.45, streaks: 0.7, hueVariation: 0.25 }),
    uses: { top: ['ewz-ambrosia-drop'], neck: ['ewz-ambrosia-neck'], fretboard: ['ewz-fb-ambrosia'], headplate: ['ewz-hp-ambrosia'] },
    blurb: 'Soft maple with beetle-trail streaks and flame.',
  },
  {
    id: 'spalted-tamarind', name: 'Spalted Tamarind', density: 760, openGrain: false,
    look: look({ light: '#e6d3a8', dark: '#3b2a1a', grainFreq: 1.0, grainContrast: 0.2, figure: 'spalted', figureStrength: 0.9, figureScale: 1, hueVariation: 0.15 }),
    uses: { top: ['ewz-tamarind-drop'], body: ['ewz-tamarind-body'] },
    blurb: 'Black zone lines through pale wood.',
  },
  {
    id: 'koa', name: 'Curly Hawaiian Koa', density: 610, openGrain: true,
    look: look({ light: '#c98a4b', dark: '#6b3d1c', grainFreq: 1.3, grainContrast: 0.4, cathedral: 0.2, pores: 0.3, poreContrast: 0.25, figure: 'flame', figureStrength: 0.6, streaks: 0.5 }),
    uses: { top: ['ewz-koa-drop'], fretboard: ['ewz-fb-koa'], headplate: ['ewz-hp-koa'] },
    blurb: 'Golden-brown with deep curl and chatoyance.',
  },
  {
    id: 'burl', name: 'Red Gum Burl', density: 820, openGrain: false,
    look: look({ light: '#c2683f', dark: '#5a2414', grainFreq: 0.6, grainContrast: 0.3, figure: 'burl', figureStrength: 0.9, figureScale: 1 }),
    uses: { top: ['ewz-burl-drop'] },
    blurb: 'Swirling burl with tight eyes.',
  },
  {
    id: 'padauk', name: 'Padauk', density: 745, openGrain: true,
    look: look({ light: '#e0562c', dark: '#8f2614', grainFreq: 1.5, grainContrast: 0.3, pores: 0.4, poreContrast: 0.3, figure: 'ribbon', figureStrength: 0.2 }),
    uses: { body: ['ewz-padauk-body'], top: ['ewz-padauk-drop'] },
    blurb: 'Vivid orange-red that mellows to brown over time.',
  },
  {
    id: 'purpleheart', name: 'Purpleheart', density: 880, openGrain: false,
    look: look({ light: '#9a4a78', dark: '#5a2346', grainFreq: 1.6, grainContrast: 0.25, figure: 'ribbon', figureStrength: 0.2 }),
    uses: { body: ['ewz-purpleheart-body'], top: ['ewz-purpleheart-drop'], neck: ['ewz-purpleheart-neck'], fretboard: ['ewz-fb-purpleheart'], headplate: ['ewz-hp-purpleheart'] },
    blurb: 'Hard, heavy and genuinely purple.',
  },
  {
    id: 'sapele', name: 'Sapele', density: 640, openGrain: true,
    look: look({ light: '#b8693f', dark: '#6e331b', grainFreq: 1.8, grainContrast: 0.3, pores: 0.5, poreContrast: 0.3, figure: 'ribbon', figureStrength: 0.6, figureScale: 0.8 }),
    uses: { body: ['ewz-sapele-body'] },
    blurb: 'Mahogany cousin with striking ribbon stripe.',
  },
  {
    id: 'quilted-sapele', name: 'Quilted Sapele', density: 640, openGrain: true,
    look: look({ light: '#c27546', dark: '#6b311a', grainFreq: 1.5, grainContrast: 0.2, figure: 'quilt', figureStrength: 0.7 }),
    uses: { top: ['ewz-qsapele-drop'] },
    blurb: 'Deep quilt figure in reddish-brown.',
  },
  {
    id: 'bubinga', name: 'Curly Bubinga', density: 890, openGrain: false,
    look: look({ light: '#a6543a', dark: '#5c2318', grainFreq: 1.6, grainContrast: 0.35, figure: 'flame', figureStrength: 0.5, streaks: 0.4 }),
    uses: { top: ['ewz-bubinga-drop'], fretboard: ['ewz-fb-bubinga'] },
    blurb: 'Dense pinkish-red with curl and purple streaks.',
  },
  {
    id: 'black-walnut', name: 'Black Walnut', density: 610, openGrain: true,
    look: look({ light: '#7b5a3e', dark: '#3d2a1c', grainFreq: 1.2, grainContrast: 0.35, cathedral: 0.5, pores: 0.6, poreContrast: 0.35, streaks: 0.35 }),
    uses: { body: ['ewz-walnut-body'], top: ['ewz-walnut-drop'], fretboard: ['ewz-fb-walnut'] },
    blurb: 'Chocolate brown, warm and woody.',
  },
  {
    id: 'cherry', name: 'American Cherry', density: 560, openGrain: false,
    look: look({ light: '#c98a5e', dark: '#8e5233', grainFreq: 1.3, grainContrast: 0.25, cathedral: 0.4 }),
    uses: { body: ['ewz-cherry-body'], neck: ['ewz-cherry-neck'] },
    blurb: 'Pinkish-brown that darkens with age.',
  },
  {
    id: 'spanish-cedar', name: 'Spanish Cedar', density: 470, openGrain: true,
    look: look({ light: '#c98d66', dark: '#8c5638', grainFreq: 1.1, grainContrast: 0.35, cathedral: 0.5, pores: 0.4, poreContrast: 0.25 }),
    uses: { body: ['ewz-cedar-body'] },
    blurb: 'Light and aromatic, mahogany-like look.',
  },
  {
    id: 'bw-ebony', name: 'Black & White Ebony', density: 1000, openGrain: false,
    look: look({ light: '#e8dcc0', dark: '#151210', grainFreq: 0.8, grainContrast: 0.2, figure: 'stripe', figureStrength: 1, figureScale: 2 }),
    uses: { top: ['ewz-bwebony-drop'] },
    blurb: 'Pale moon ebony: cream with bold black streaks.',
  },
  {
    id: 'santos-rosewood', name: 'Santos Rosewood (Morado)', density: 860, openGrain: true,
    look: look({ light: '#8a5634', dark: '#3e2216', grainFreq: 2.0, grainContrast: 0.45, pores: 0.4, poreContrast: 0.3, streaks: 0.5, waviness: 0.6 }),
    uses: { top: ['ewz-santos-drop'] },
    blurb: 'Rosewood-like stripes in purple-brown.',
  },
  {
    id: 'indian-rosewood', name: 'East Indian Rosewood', density: 830, openGrain: true,
    look: look({ light: '#6e4632', dark: '#2e1b14', grainFreq: 2.2, grainContrast: 0.4, pores: 0.6, poreContrast: 0.3, streaks: 0.5, waviness: 0.6 }),
    uses: { fretboard: ['sm-fb-eir-pack', 'ewz-fb-eir-slotted'], neck: ['ewz-eir-neck'], headplate: ['ewz-hp-eir', 'sm-headplate'] },
    blurb: 'The classic dark fretboard wood.',
  },
  {
    id: 'pau-ferro', name: 'Pau Ferro', density: 870, openGrain: true,
    look: look({ light: '#8c5a3a', dark: '#4a2a1a', grainFreq: 2.0, grainContrast: 0.35, pores: 0.5, poreContrast: 0.25, streaks: 0.35 }),
    uses: { fretboard: ['sm-fb-unslotted'], headplate: ['sm-headplate'] },
    blurb: 'Rosewood alternative, slightly lighter.',
  },
  {
    id: 'ebony', name: 'Gaboon Ebony', density: 1000, openGrain: false,
    look: look({ light: '#2a2522', dark: '#0c0a09', grainFreq: 1.5, grainContrast: 0.25, streaks: 0.15 }),
    uses: { fretboard: ['ewz-fb-ebony', 'sm-fb-unslotted'], headplate: ['ewz-hp-ebony', 'sm-headplate'] },
    blurb: 'Jet black, smooth and dense.',
  },
  {
    id: 'pale-moon-ebony', name: 'Pale Moon Ebony', density: 1000, openGrain: false,
    look: look({ light: '#c9bb98', dark: '#1c1814', grainFreq: 0.8, grainContrast: 0.2, figure: 'stripe', figureStrength: 0.8, figureScale: 1.6 }),
    uses: { fretboard: ['ewz-fb-palemoon-slotted'] },
    blurb: 'Cream ebony with dark streaks.',
  },
  {
    id: 'granadillo', name: 'Granadillo', density: 1000, openGrain: false,
    look: look({ light: '#8a4a2c', dark: '#3f1c10', grainFreq: 2.0, grainContrast: 0.4, streaks: 0.4 }),
    uses: { fretboard: ['ewz-fb-granadillo'], neck: ['ewz-granadillo-neck'], headplate: ['ewz-hp-granadillo'] },
    blurb: 'Dense red-brown rosewood alternative.',
  },
]

export const WOOD_MAP: Record<string, Wood> = Object.fromEntries(WOODS.map((w) => [w.id, w]))

export function wood(id: string): Wood {
  return WOOD_MAP[id] ?? WOODS[0]
}

export function woodsFor(use: WoodUse): Wood[] {
  return WOODS.filter((w) => w.uses[use]?.length)
}
