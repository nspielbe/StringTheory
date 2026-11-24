// Purchasable parts. Prices were read from each vendor's live site on
// PRICE_CHECKED. "verified: false" marks prices that are estimates or that
// the store did not show directly (always open the link before buying).
// Prices drift; users can override any price/qty in the build sheet.

export const PRICE_CHECKED = '2026-11-24'

export type VendorId =
  | 'stewmac'
  | 'ewz'
  | 'hipshot'
  | 'floyd'
  | 'duncan'
  | 'dimarzio'
  | 'bkp'

export interface Vendor {
  id: VendorId
  name: string
  url: string
  currency: 'USD' | 'GBP'
  note?: string
}

export const VENDORS: Record<VendorId, Vendor> = {
  stewmac: { id: 'stewmac', name: 'StewMac', url: 'https://www.stewmac.com', currency: 'USD' },
  ewz: {
    id: 'ewz',
    name: 'Exotic Wood Zone',
    url: 'https://exoticwoodzone.com',
    currency: 'USD',
    note: 'exoticwoods.com is now a parked domain; Exotic Wood Zone is the active exotic-tonewood store. Figured tops are one-of-a-kind, so links go to the collection.',
  },
  hipshot: { id: 'hipshot', name: 'Hipshot', url: 'https://hipshotproducts.com', currency: 'USD' },
  floyd: { id: 'floyd', name: 'Floyd Rose', url: 'https://www.floydrose.com', currency: 'USD' },
  duncan: { id: 'duncan', name: 'Seymour Duncan', url: 'https://www.seymourduncan.com', currency: 'USD' },
  dimarzio: { id: 'dimarzio', name: 'DiMarzio', url: 'https://www.dimarzio.com', currency: 'USD' },
  bkp: {
    id: 'bkp',
    name: 'Bare Knuckle Pickups',
    url: 'https://www.bareknucklepickups.co.uk',
    currency: 'GBP',
    note: 'Prices are listed in GBP ("from" price per pickup). Converted using the rate in the build sheet.',
  },
}

export type ProductCategory =
  | 'wood'
  | 'pickup'
  | 'bridge'
  | 'tuners'
  | 'nut'
  | 'frets'
  | 'truss'
  | 'inlay'
  | 'electronics'
  | 'knobs'
  | 'strap'
  | 'plates'
  | 'pickguard'
  | 'finishing'
  | 'supplies'
  | 'strings'

export interface Product {
  id: string
  vendor: VendorId
  name: string
  url: string
  price: number
  category: ProductCategory
  /** Price shown is a starting price across options. */
  from?: boolean
  verified: boolean
  note?: string
  dims?: string
  /** Pickup metadata. */
  pickup?: {
    type: 'humbucker' | 'single' | 'single-hb' | 'p90' | 'tele-bridge'
    positions: ('neck' | 'middle' | 'bridge')[]
    output: 'vintage' | 'medium' | 'high' | 'active'
    seven?: boolean
    set?: number
  }
  /** Bridge metadata. */
  bridge?: { type: string; strings: number[] }
  tuners?: { layout: 'inline' | 'split' | 'single'; strings?: number }
}

const sm = 'https://www.stewmac.com'
const ewz = 'https://exoticwoodzone.com'
const hs = 'https://hipshotproducts.com/products'
const fr = 'https://www.floydrose.com/products'
const sd = 'https://www.seymourduncan.com/single-product'
const dm = 'https://www.dimarzio.com/pickups'
const bk = 'https://www.bareknucklepickups.co.uk/pickup'

const P: Product[] = [
  // ---------------------------------------------------------------- WOOD: bodies
  { id: 'sm-alder-body', vendor: 'stewmac', category: 'wood', name: 'Alder Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/alder-body-blank`, price: 98.49, from: true, verified: true },
  { id: 'ewz-alder-body', vendor: 'ewz', category: 'wood', name: 'Alder Guitar Body Blank', url: `${ewz}/products/alder-guitar-body-blank`, price: 72.0, verified: true, dims: '21" x 14" x 2"' },
  { id: 'sm-swampash-body', vendor: 'stewmac', category: 'wood', name: 'Swamp Ash Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/swamp-ash-body-blank`, price: 105.49, from: true, verified: true, note: '3-piece from $105.49, 2-piece $126.49, 1-piece $143.49' },
  { id: 'ewz-whiteash-body', vendor: 'ewz', category: 'wood', name: 'White Ash Guitar Body Blank', url: `${ewz}/products/white-ash-guitar-body-blanks`, price: 69.0, verified: true },
  { id: 'sm-afmahog-body', vendor: 'stewmac', category: 'wood', name: 'African Mahogany Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/african-mahogany-body-blank`, price: 61.49, from: true, verified: true },
  { id: 'ewz-afmahog-body', vendor: 'ewz', category: 'wood', name: 'African Mahogany Guitar Body Blank', url: `${ewz}/products/african-mahogany-khaya-guitar-body-blank`, price: 70.0, verified: true },
  { id: 'sm-hmahog-body', vendor: 'stewmac', category: 'wood', name: 'Honduran Mahogany Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/honduran-mahogany-body-blank`, price: 89.49, from: true, verified: true },
  { id: 'sm-basswood-body', vendor: 'stewmac', category: 'wood', name: 'Basswood Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/basswood-body-blank`, price: 115.49, verified: true },
  { id: 'ewz-basswood-body', vendor: 'ewz', category: 'wood', name: 'Basswood Guitar Body Blank', url: `${ewz}/products/basswood-guitar-body-blank`, price: 55.0, verified: true },
  { id: 'sm-poplar-body', vendor: 'stewmac', category: 'wood', name: 'Poplar Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/poplar-body-blank`, price: 76.99, verified: true },
  { id: 'sm-poplar-paint-body', vendor: 'stewmac', category: 'wood', name: 'Poplar Paint-grade Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/poplar-paint-grade-body-blank`, price: 49.99, verified: true, note: 'Paint grade: for solid colour finishes' },
  { id: 'ewz-poplar-body', vendor: 'ewz', category: 'wood', name: 'Yellow Poplar Guitar Body Blank', url: `${ewz}/products/yellow-poplar-guitar-body-blank`, price: 55.0, verified: true },
  { id: 'sm-blimba-body', vendor: 'stewmac', category: 'wood', name: 'Black Limba Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/`, price: 87.99, from: true, verified: true },
  { id: 'ewz-blimba-body', vendor: 'ewz', category: 'wood', name: 'Black Limba Guitar Body Blank', url: `${ewz}/products/black-limba-guitar-body-blank`, price: 75.0, verified: true },
  { id: 'sm-korina-body', vendor: 'stewmac', category: 'wood', name: 'Korina (White Limba) Body Blank', url: `${sm}/tonewoods/wood-parts/body-blanks/`, price: 87.99, from: true, verified: true },
  { id: 'ewz-maple-body', vendor: 'ewz', category: 'wood', name: 'Hard Maple Guitar Body Blank', url: `${ewz}/products/hard-maple-guitar-body-blank`, price: 70.28, verified: true },
  { id: 'ewz-walnut-body', vendor: 'ewz', category: 'wood', name: 'Black Walnut Guitar Body Blanks (collection)', url: `${ewz}/collections/black-walnut-guitar-body-blanks`, price: 95.0, verified: false, note: 'Sold out when checked; price is an estimate' },
  { id: 'ewz-sapele-body', vendor: 'ewz', category: 'wood', name: 'Sapele Guitar Body Blank', url: `${ewz}/products/sapele-guitar-body-blank`, price: 80.0, verified: true },
  { id: 'ewz-padauk-body', vendor: 'ewz', category: 'wood', name: 'Padauk Guitar Body Blank', url: `${ewz}/products/padauk-guitar-body-blank`, price: 87.0, verified: true },
  { id: 'ewz-purpleheart-body', vendor: 'ewz', category: 'wood', name: 'Purpleheart Guitar Body Blank', url: `${ewz}/products/purpleheart-guitar-body-blank`, price: 87.0, verified: true },
  { id: 'ewz-cherry-body', vendor: 'ewz', category: 'wood', name: 'American Cherry Guitar Body Blank', url: `${ewz}/products/cherry-guitar-body-blank`, price: 56.25, verified: true },
  { id: 'ewz-cedar-body', vendor: 'ewz', category: 'wood', name: 'Spanish Cedar Guitar Body Blank', url: `${ewz}/products/spanish-cedar-guitar-body-blank`, price: 74.0, verified: true },
  { id: 'ewz-tamarind-body', vendor: 'ewz', category: 'wood', name: 'Spalted Tamarind Guitar Body Blank', url: `${ewz}/products/spalted-tamarind-guitar-body-blank-luthier-tonewood-for-electric-guitars`, price: 89.95, verified: true },
  { id: 'ewz-mahog-oversize', vendor: 'ewz', category: 'wood', name: 'Premium Mahogany Guitar Body Blank 28" x 18" x 2"', url: `${ewz}/products/premium-mahogany-guitar-body-blank-28-x-18-x-2-single-piece-20`, price: 169.0, verified: true, dims: '28" x 18" x 2"', note: 'Oversize blank for V / X style bodies' },

  // ---------------------------------------------------------------- WOOD: tops
  { id: 'ewz-flame-drop', vendor: 'ewz', category: 'wood', name: 'Flame Hard Maple Drop Top AAAA (bookmatched)', url: `${ewz}/collections/flame-hard-maple-drop-tops`, price: 159.85, verified: true, dims: '21" x 7-3/4" x 3/8" per half' },
  { id: 'ewz-flame-carved', vendor: 'ewz', category: 'wood', name: 'Flame Hard Maple Carved Top', url: `${ewz}/collections/flame-maple-carved-tops`, price: 169.15, verified: true, dims: '20-1/2" x 8-7/8" x 1-1/8" per half' },
  { id: 'ewz-quilt-drop', vendor: 'ewz', category: 'wood', name: 'Quilted Flame Maple Bookmatched Drop Top Set', url: `${ewz}/collections/quilted-flame-maple`, price: 249.0, verified: true, dims: '19" x 7-1/4" x 3/8" per half' },
  { id: 'ewz-quilt-carved', vendor: 'ewz', category: 'wood', name: 'Quilted Flame Maple Bookmatched Carved Top', url: `${ewz}/collections/quilted-flame-maple-carved-top`, price: 211.65, verified: true, dims: '20" x 7-1/2" x 1-1/8" per half' },
  { id: 'ewz-birdseye-drop', vendor: 'ewz', category: 'wood', name: 'Birdseye Maple Drop Top', url: `${ewz}/collections/birds-eye-maple-drop-tops-1`, price: 149.0, verified: true, dims: '21" x 7" x 1/4"' },
  { id: 'ewz-ambrosia-drop', vendor: 'ewz', category: 'wood', name: 'Flame Ambrosia Maple Drop Top', url: `${ewz}/collections/flame-ambrosia-maple-drop-top`, price: 129.99, verified: true, dims: '22" x 7-1/4" x 3/8"' },
  { id: 'ewz-tamarind-drop', vendor: 'ewz', category: 'wood', name: 'Spalted Tamarind Drop Top', url: `${ewz}/collections/spalted-tamarind-drop-tops`, price: 49.95, verified: true, dims: '22" x 7-3/8" x 3/8"' },
  { id: 'ewz-koa-drop', vendor: 'ewz', category: 'wood', name: 'Curly Flame Hawaiian Koa Bookmatched Drop Top', url: `${ewz}/collections/hawaiian-curly-flame-koa-drop-tops`, price: 229.0, verified: true, dims: '21" x 7-1/4" x 1/4"' },
  { id: 'ewz-burl-drop', vendor: 'ewz', category: 'wood', name: 'Australian Red Gum Burl Drop Top Set', url: `${ewz}/collections/red-gum-drop-top`, price: 219.99, verified: true, dims: '21" x 14" x 3/8"' },
  { id: 'ewz-padauk-drop', vendor: 'ewz', category: 'wood', name: 'Padauk Guitar Drop Top', url: `${ewz}/collections/padauk-drop-tops`, price: 70.83, verified: true },
  { id: 'ewz-purpleheart-drop', vendor: 'ewz', category: 'wood', name: 'Purpleheart Guitar Drop Top', url: `${ewz}/collections/purpleheart-guitar-drop-top`, price: 39.95, verified: true },
  { id: 'ewz-qsapele-drop', vendor: 'ewz', category: 'wood', name: 'Quilted Sapele Drop Top', url: `${ewz}/collections/quilted-sapele-guitar-drop-top`, price: 159.0, verified: true },
  { id: 'ewz-blimba-drop', vendor: 'ewz', category: 'wood', name: 'Black Limba Guitar Drop Top', url: `${ewz}/collections/black-limba-drop-tops`, price: 49.95, verified: true },
  { id: 'ewz-bubinga-drop', vendor: 'ewz', category: 'wood', name: 'Figured Curly Bubinga Bookmatched Drop Top', url: `${ewz}/collections/figured-curly-bubinga-drop-tops`, price: 129.95, verified: true },
  { id: 'ewz-bwebony-drop', vendor: 'ewz', category: 'wood', name: 'Black and White Ebony Bookmatched Drop Top', url: `${ewz}/collections/black-and-white-ebony-drop-top`, price: 299.0, verified: true },
  { id: 'ewz-santos-drop', vendor: 'ewz', category: 'wood', name: 'Santos Rosewood / Morado Drop Top', url: `${ewz}/collections/santos-rosewood-drop-tops`, price: 149.99, verified: true },
  { id: 'ewz-walnut-drop', vendor: 'ewz', category: 'wood', name: 'Black Walnut Drop Tops (collection)', url: `${ewz}/collections/black-walnut-drop-tops`, price: 89.0, verified: false, note: 'Sold out when checked; price is an estimate' },
  { id: 'ewz-maple-carved-plain', vendor: 'ewz', category: 'wood', name: 'Maple Electric Guitar Carved Top / Plate', url: `${ewz}/collections/flame-maple-carved-tops`, price: 149.17, verified: true },

  // ---------------------------------------------------------------- WOOD: necks
  { id: 'sm-maple-neck', vendor: 'stewmac', category: 'wood', name: 'Maple Guitar Neck Blank, AAA, 1" x 3" x 24"', url: `${sm}/tonewoods/wood-parts/electric-guitar-neck-blanks`, price: 22.49, verified: true, note: 'Item 2690. 3+3 / angled headstocks may need the 13/16" x 3-7/8" x 27" blank ($28.99, item 5130).' },
  { id: 'sm-maple-neck-wide', vendor: 'stewmac', category: 'wood', name: 'Maple Guitar Neck Blank, AAA, 13/16" x 3-7/8" x 27"', url: `${sm}/tonewoods/wood-parts/electric-guitar-neck-blanks`, price: 28.99, verified: true, note: 'Item 5130' },
  { id: 'ewz-maple-neck', vendor: 'ewz', category: 'wood', name: 'Hard Maple Guitar Neck Blank (flat sawn)', url: `${ewz}/products/hard-maple-guitar-neck-blanks`, price: 15.29, verified: true },
  { id: 'sm-roasted-neck', vendor: 'stewmac', category: 'wood', name: 'Torrefied Maple Electric Guitar Neck Blank', url: `${sm}/tonewoods/wood-parts/torrefied-maple-electric-guitar-neck-blanks`, price: 88.99, from: true, verified: true },
  { id: 'ewz-flame-neck', vendor: 'ewz', category: 'wood', name: 'Flame Maple Guitar Neck Blank AAAA (quartersawn)', url: `${ewz}/collections/flame-hard-maple-guitar-neck-blank-aaaa-grade`, price: 279.0, verified: true },
  { id: 'ewz-birdseye-neck', vendor: 'ewz', category: 'wood', name: 'Birdseye Maple Guitar Neck Blank', url: `${ewz}/products/birds-eye-maple-guitar-neck-blanks`, price: 18.0, verified: true },
  { id: 'ewz-ambrosia-neck', vendor: 'ewz', category: 'wood', name: 'Ambrosia Maple Neck Blank for Electric Guitar', url: `${ewz}/products/ambrosia-maple-neck-blank-for-electric-guitar`, price: 32.0, verified: true },
  { id: 'sm-afmahog-neck', vendor: 'stewmac', category: 'wood', name: 'African Mahogany Neck Blank', url: `${sm}/tonewoods/wood-parts/african-mahogany-neck-blanks`, price: 19.98, verified: true },
  { id: 'sm-hmahog-neck', vendor: 'stewmac', category: 'wood', name: 'Honduran Mahogany Neck Blank', url: `${sm}/tonewoods/wood-parts/honduran-mahogany-neck-blanks`, price: 34.49, from: true, verified: true },
  { id: 'ewz-mahog-neck', vendor: 'ewz', category: 'wood', name: 'Mahogany Guitar Neck Blank', url: `${ewz}/products/indian-mahogany-guitar-neck-blank`, price: 16.0, verified: true },
  { id: 'ewz-wlimba-neck', vendor: 'ewz', category: 'wood', name: 'White Limba Neck Blank for Electric Guitar', url: `${ewz}/products/white-limba-neck-blank-for-electric-guitar`, price: 18.75, verified: true },
  { id: 'ewz-purpleheart-neck', vendor: 'ewz', category: 'wood', name: 'Purpleheart Neck Blank for Electric Guitar', url: `${ewz}/products/purpleheart-neck-blank-for-electric-guitar`, price: 23.2, verified: true },
  { id: 'ewz-granadillo-neck', vendor: 'ewz', category: 'wood', name: 'Granadillo Neck Blank for Electric Guitar', url: `${ewz}/products/granadillo-neck-blank-for-electric-guitar`, price: 26.64, verified: true },
  { id: 'ewz-eir-neck', vendor: 'ewz', category: 'wood', name: 'East Indian Rosewood Guitar Neck Blank', url: `${ewz}/products/east-indian-rosewood-guitar-neck-blanks`, price: 65.0, verified: true },
  { id: 'ewz-cherry-neck', vendor: 'ewz', category: 'wood', name: 'Cherry Guitar Neck Blank', url: `${ewz}/products/cherry-guitar-neck-blanks`, price: 14.99, verified: true },

  // ---------------------------------------------------------------- WOOD: fingerboards
  { id: 'sm-fb-unslotted', vendor: 'stewmac', category: 'wood', name: 'Unslotted Fingerboard for Guitar (choose species)', url: `${sm}/tonewoods/wood-parts/unslotted-fingerboard-for-guitar`, price: 14.99, from: true, verified: true },
  { id: 'sm-fb-eir-pack', vendor: 'stewmac', category: 'wood', name: 'Unslotted Indian Rosewood Fingerboard Value Pack', url: `${sm}/tonewoods/wood-parts/unslotted-indian-rosewood-fingerboard-blank-pack`, price: 19.78, verified: true },
  { id: 'sm-fb-fender-95', vendor: 'stewmac', category: 'wood', name: 'Slotted Fingerboard for Fender Guitar (25.5"), 9-1/2" radius', url: `${sm}/tonewoods/wood-parts/slotted-fingerboard-for-fender-guitar-9-1-2-radius`, price: 29.99, from: true, verified: true },
  { id: 'sm-fb-fender-12', vendor: 'stewmac', category: 'wood', name: 'Slotted Fingerboard for Fender Guitar (25.5"), 12" radius', url: `${sm}/tonewoods/wood-parts/slotted-fingerboard-for-fender-guitar`, price: 29.99, from: true, verified: true },
  { id: 'sm-fb-fender-compound', vendor: 'stewmac', category: 'wood', name: 'Slotted Fingerboard for Fender Guitar (25.5"), compound radius', url: `${sm}/tonewoods/wood-parts/slotted-fingerboard-for-fender-guitar-compound-radius`, price: 34.49, from: true, verified: true },
  { id: 'sm-fb-gibson', vendor: 'stewmac', category: 'wood', name: 'Slotted Fingerboard for Gibson (24.75")', url: `${sm}/tonewoods/wood-parts/slotted-fingerboard-for-gibson`, price: 24.99, from: true, verified: true },
  { id: 'sm-fb-prs', vendor: 'stewmac', category: 'wood', name: 'Slotted Fingerboard for PRS-style 25" scale', url: `${sm}/tonewoods/wood-parts/slotted-fingerboard-for-paul-reed-smith-and-dobro-guitars`, price: 24.99, from: true, verified: true },
  { id: 'ewz-fb-eir-slotted', vendor: 'ewz', category: 'wood', name: 'East Indian Rosewood Slotted Fingerboard (25.5", 10" radius)', url: `${ewz}/products/premium-east-indian-rosewood-slotted-fingerboard-for-fender-guitars-10-radius`, price: 34.56, verified: true },
  { id: 'ewz-fb-palemoon-slotted', vendor: 'ewz', category: 'wood', name: 'Pale Moon Ebony Slotted Fingerboard (25.5", 10" radius)', url: `${ewz}/products/premium-pale-moon-ebony-slotted-fingerboard-for-fender-guitars-10-radius`, price: 47.89, verified: true },
  { id: 'ewz-fb-ebony', vendor: 'ewz', category: 'wood', name: 'Gaboon Ebony Guitar Fingerboard Blank', url: `${ewz}/products/gaboon-ebony-guitar-fingerboard-blank`, price: 53.95, verified: true },
  { id: 'ewz-fb-maple', vendor: 'ewz', category: 'wood', name: 'Hard Maple Guitar Fingerboard Blank', url: `${ewz}/products/hard-maple-guitar-fingerboard-blank`, price: 7.99, verified: true },
  { id: 'ewz-fb-flame', vendor: 'ewz', category: 'wood', name: 'Flame Hard Maple Fingerboard AAA/AAAA', url: `${ewz}/products/flame-hard-maple-guitar-fingerboard-aaa-aaaa-grade-21-x-2-1-2-x-3-8`, price: 15.92, verified: true },
  { id: 'ewz-fb-walnut', vendor: 'ewz', category: 'wood', name: 'Black Walnut Guitar Fingerboard Blank', url: `${ewz}/products/black-walnut-guitar-fingerboard-blank`, price: 11.98, verified: true },
  { id: 'ewz-fb-koa', vendor: 'ewz', category: 'wood', name: 'Hawaiian Koa Guitar Fingerboard Blank', url: `${ewz}/products/curly-flame-hawaiian-koa-guitar-fingerboard-blank`, price: 18.99, verified: true },
  { id: 'ewz-fb-bubinga', vendor: 'ewz', category: 'wood', name: 'Bubinga Guitar Fingerboard Blank', url: `${ewz}/products/bubinga-guitar-fingerboard-blanks`, price: 26.97, verified: true },
  { id: 'ewz-fb-purpleheart', vendor: 'ewz', category: 'wood', name: 'Purpleheart Guitar Fingerboard Blank', url: `${ewz}/products/purpleheart-guitar-fingerboard-blank`, price: 6.99, verified: true },
  { id: 'ewz-fb-granadillo', vendor: 'ewz', category: 'wood', name: 'Granadillo Guitar Fingerboard Blank', url: `${ewz}/products/granadillo-guitar-fingerboard-blank`, price: 8.99, verified: true },
  { id: 'ewz-fb-blimba', vendor: 'ewz', category: 'wood', name: 'Black Limba Guitar Fingerboard Blank', url: `${ewz}/products/black-limba-guitar-fingerboard-blank`, price: 8.25, verified: true },
  { id: 'ewz-fb-ambrosia', vendor: 'ewz', category: 'wood', name: 'Ambrosia Maple Guitar Fingerboard Blank', url: `${ewz}/products/ambrosia-maple-guitar-fingerboard-blank`, price: 7.55, verified: true },

  // ---------------------------------------------------------------- WOOD: headstock veneers
  { id: 'sm-headplate', vendor: 'stewmac', category: 'wood', name: 'Peghead Overlay Veneer (choose species)', url: `${sm}/tonewoods/wood-parts/peghead-overlay-veneer`, price: 5.69, from: true, verified: true },
  { id: 'ewz-hp-eir', vendor: 'ewz', category: 'wood', name: 'East Indian Rosewood Headplate 5" x 4" x 3/16"', url: `${ewz}/products/east-indian-rosewood-guitar-headplate-wood-blank-5-x-4-x-3-16`, price: 4.19, verified: true },
  { id: 'ewz-hp-ebony', vendor: 'ewz', category: 'wood', name: 'Indian Ebony Guitar Headplate', url: `${ewz}/products/indian-ebony-guitar-headplate-wood-blank`, price: 7.0, verified: true },
  { id: 'ewz-hp-koa', vendor: 'ewz', category: 'wood', name: 'Hawaiian Koa Guitar Headplate', url: `${ewz}/products/curly-flame-hawaiian-koa-guitar-headplate-wood-blank`, price: 13.95, verified: true },
  { id: 'ewz-hp-flame', vendor: 'ewz', category: 'wood', name: 'Flame Hard Maple Guitar Headplate', url: `${ewz}/products/flame-hard-maple-guitar-headplates`, price: 10.2, verified: true },
  { id: 'ewz-hp-blimba', vendor: 'ewz', category: 'wood', name: 'Black Limba Guitar Headplate', url: `${ewz}/products/black-limba-guitar-headplate-wood-blank`, price: 9.02, verified: true },
  { id: 'ewz-hp-purpleheart', vendor: 'ewz', category: 'wood', name: 'Purpleheart Guitar Headplate', url: `${ewz}/products/purpleheart-guitar-headplate-wood-blank`, price: 6.29, verified: true },
  { id: 'ewz-hp-granadillo', vendor: 'ewz', category: 'wood', name: 'Granadillo Guitar Headplate', url: `${ewz}/products/granadillo-guitar-headplate-wood-blank`, price: 4.04, verified: true },
  { id: 'ewz-hp-ambrosia', vendor: 'ewz', category: 'wood', name: 'Ambrosia Maple Guitar Headplate', url: `${ewz}/products/ambrosia-maple-guitar-headplate-wood-blank`, price: 4.99, verified: true },
  { id: 'ewz-hp-mahog', vendor: 'ewz', category: 'wood', name: 'African Mahogany Guitar Headplate', url: `${ewz}/products/african-mahogany-guitar-headplate-wood-blank`, price: 4.99, verified: true },
  { id: 'ewz-hp-ash', vendor: 'ewz', category: 'wood', name: 'White Ash Guitar Headplate', url: `${ewz}/products/white-ash-guitar-headplate-wood-blank`, price: 4.49, verified: true },

  // ---------------------------------------------------------------- PICKUPS: Seymour Duncan
  { id: 'sd-jb', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan JB Model SH-4', url: `${sd}/jb-model`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high', seven: true } },
  { id: 'sd-jazz', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Jazz Model SH-2', url: `${sd}/jazz-model`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['neck'], output: 'medium' } },
  { id: 'sd-59', vendor: 'duncan', category: 'pickup', name: "Seymour Duncan '59 Model SH-1", url: `${sd}/59-model`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'vintage', seven: true } },
  { id: 'sd-pearly', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Pearly Gates', url: `${sd}/pearly-gates`, price: 129, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'medium' } },
  { id: 'sd-seth', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Seth Lover', url: `${sd}/seth-lover`, price: 139, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'vintage' } },
  { id: 'sd-custom5', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Custom 5', url: `${sd}/custom-5`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high' } },
  { id: 'sd-invader', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Invader', url: `${sd}/invader`, price: 115, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high' } },
  { id: 'sd-pegasus', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Pegasus', url: `${sd}/pegasus`, price: 115, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high', seven: true } },
  { id: 'sd-sentient', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Sentient', url: `${sd}/sentient`, price: 115, verified: true, pickup: { type: 'humbucker', positions: ['neck'], output: 'medium', seven: true } },
  { id: 'sd-nazgul', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Nazgûl', url: `${sd}/nazgul`, price: 115, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high', seven: true } },
  { id: 'sd-fullshred', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Full Shred', url: `${sd}/full-shred`, price: 115, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high' } },
  { id: 'sd-mortalcoil', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan MortalCoil (active)', url: `${sd}/mortalcoil`, price: 169, verified: true, note: 'Active: needs a 9V battery box and low-value pots', pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'active' } },
  { id: 'sd-hotrodded', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Hot Rodded Set (JB + Jazz)', url: `${sd}/hot-rodded`, price: 198, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high', set: 2 } },
  { id: 'sd-ssl1', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Vintage Staggered SSL-1', url: `${sd}/vintage-staggered-strat`, price: 79, verified: true, pickup: { type: 'single', positions: ['neck', 'middle', 'bridge'], output: 'vintage' } },
  { id: 'sd-qp', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Quarter Pound Strat', url: `${sd}/quarter-pound-staggered-strat`, price: 79, verified: true, pickup: { type: 'single', positions: ['neck', 'middle', 'bridge'], output: 'high' } },
  { id: 'sd-little59', vendor: 'duncan', category: 'pickup', name: "Seymour Duncan Little '59 Strat", url: `${sd}/little-59-strat`, price: 99, verified: true, pickup: { type: 'single-hb', positions: ['neck', 'middle', 'bridge'], output: 'medium' } },
  { id: 'sd-hotrails', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Hot Rails Strat', url: `${sd}/hot-rails-strat`, price: 99, verified: true, pickup: { type: 'single-hb', positions: ['neck', 'middle', 'bridge'], output: 'high' } },
  { id: 'sd-duckbucker', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Duckbuckers Strat', url: `${sd}/duckbucker`, price: 99, verified: true, pickup: { type: 'single-hb', positions: ['neck', 'middle', 'bridge'], output: 'vintage' } },
  { id: 'sd-broadcaster', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Vintage Broadcaster Tele (bridge)', url: `${sd}/vintage-broadcaster`, price: 89, verified: true, pickup: { type: 'tele-bridge', positions: ['bridge'], output: 'medium' } },
  { id: 'sd-antiquity-p90', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Antiquity P90', url: `${sd}/antiquity-p90`, price: 139, verified: true, pickup: { type: 'p90', positions: ['neck', 'middle', 'bridge'], output: 'vintage' } },
  { id: 'sd-hotp90', vendor: 'duncan', category: 'pickup', name: 'Seymour Duncan Hot P90 Silencer', url: `${sd}/hot-p90-silencer`, price: 145, verified: true, pickup: { type: 'p90', positions: ['neck', 'middle', 'bridge'], output: 'high' } },

  // ---------------------------------------------------------------- PICKUPS: DiMarzio
  { id: 'dm-superdist', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio Super Distortion DP100', url: `${dm}/high-power/super-distortion`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high' } },
  { id: 'dm-paf36-b', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio PAF 36th Anniversary Bridge DP223', url: `${dm}/vintage-paf-output/paf-36th-anniversary-bridge`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'vintage' } },
  { id: 'dm-paf36-n', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio PAF 36th Anniversary Neck DP103', url: `${dm}/vintage-paf-output/paf-36th-anniversary-neck`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['neck'], output: 'vintage' } },
  { id: 'dm-airnorton', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio Air Norton DP193', url: `${dm}/vintage-paf-output/air-norton`, price: 106, verified: true, pickup: { type: 'humbucker', positions: ['neck'], output: 'medium' } },
  { id: 'dm-tonezone', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio Tone Zone DP155', url: `${dm}/high-power/tone-zone`, price: 106, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high' } },
  { id: 'dm-evolution', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio Evolution Bridge DP159', url: `${dm}/high-power/evolution-bridge`, price: 137, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high' } },
  { id: 'dm-crunchlab', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio Crunch Lab DP228', url: `${dm}/high-power/crunch-lab`, price: 126, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high' } },
  { id: 'dm-dactivator', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio D Activator Bridge DP220', url: `${dm}/high-power/d-activator-bridge`, price: 106, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'high' } },
  { id: 'dm-pafmaster', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio PAF Master Bridge DP261', url: `${dm}/vintage-paf-output/paf-master-bridge`, price: 99, verified: true, pickup: { type: 'humbucker', positions: ['bridge'], output: 'vintage' } },
  { id: 'dm-fasttrack1', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio Fast Track 1 DP181', url: `${dm}/rail-hum-canceling-strat/fast-track-1`, price: 99, verified: true, pickup: { type: 'single-hb', positions: ['neck', 'middle', 'bridge'], output: 'medium' } },
  { id: 'dm-chopper', vendor: 'dimarzio', category: 'pickup', name: 'DiMarzio The Chopper DP184', url: `${dm}/rail-hum-canceling-strat/chopper`, price: 99, verified: true, pickup: { type: 'single-hb', positions: ['neck', 'middle', 'bridge'], output: 'high' } },

  // ---------------------------------------------------------------- PICKUPS: Bare Knuckle (GBP)
  { id: 'bk-mule', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle The Mule', url: `${bk}/humbucker/the-mule`, price: 151, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'vintage' } },
  { id: 'bk-blackdog', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Black Dog', url: `${bk}/humbucker/black-dog`, price: 151, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'medium' } },
  { id: 'bk-riffraff', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Riff Raff', url: `${bk}/humbucker/riff-raff`, price: 151, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'medium' } },
  { id: 'bk-vhii', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle VHII', url: `${bk}/humbucker/vhii`, price: 151, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'medium' } },
  { id: 'bk-stormy', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Stormy Monday', url: `${bk}/humbucker/stormy-monday`, price: 151, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'vintage' } },
  { id: 'bk-emerald', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Emerald', url: `${bk}/humbucker/emerald`, price: 151, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'medium' } },
  { id: 'bk-abraxas', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Abraxas', url: `${bk}/humbucker/abraxas`, price: 151, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high' } },
  { id: 'bk-blackhawk', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Black Hawk', url: `${bk}/humbucker/black-hawk`, price: 159, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high' } },
  { id: 'bk-polypaf', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Polypaf', url: `${bk}/humbucker/polypaf`, price: 180, from: true, verified: true, pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'vintage' } },
  { id: 'bk-nailbomb', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Nailbomb', url: `${bk}/humbucker/nailbomb`, price: 151, from: true, verified: false, note: 'Page exists; price not confirmed', pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high', seven: true } },
  { id: 'bk-aftermath', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Aftermath', url: `${bk}/humbucker/aftermath`, price: 151, from: true, verified: false, note: 'Page exists; price not confirmed', pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high', seven: true } },
  { id: 'bk-painkiller', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Painkiller', url: `${bk}/humbucker/painkiller`, price: 151, from: true, verified: false, note: 'Page exists; price not confirmed', pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high', seven: true } },
  { id: 'bk-juggernaut', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Juggernaut', url: `${bk}/humbucker/juggernaut`, price: 151, from: true, verified: false, note: 'Page exists; price not confirmed', pickup: { type: 'humbucker', positions: ['neck', 'bridge'], output: 'high', seven: true } },
  { id: 'bk-apache', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Apache Single Coil', url: `${bk}/strat/apache-single-coil`, price: 92, from: true, verified: true, pickup: { type: 'single', positions: ['neck', 'middle', 'bridge'], output: 'vintage' } },
  { id: 'bk-mq90', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Mississippi Queen 90', url: `${bk}/p90/mississippi-queen-90`, price: 114, from: true, verified: true, pickup: { type: 'p90', positions: ['neck', 'middle', 'bridge'], output: 'medium' } },
  { id: 'bk-piledriver', vendor: 'bkp', category: 'pickup', name: 'Bare Knuckle Piledriver Tele (bridge)', url: `${bk}/tele/piledriver`, price: 92, from: true, verified: false, note: 'Page exists; price not confirmed', pickup: { type: 'tele-bridge', positions: ['bridge'], output: 'high' } },

  // ---------------------------------------------------------------- BRIDGES
  { id: 'hs-fixed', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 6 String Fixed Bridge (.125" or .175")', url: `${hs}/fixed-guitar-bridge`, price: 134.13, from: true, verified: true, bridge: { type: 'fixed', strings: [6] } },
  { id: 'hs-fixed7', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 7 String Fixed Bridge', url: `${hs}/7-string-fixed-guitar-bridge`, price: 148.15, from: true, verified: true, bridge: { type: 'fixed', strings: [7] } },
  { id: 'hs-hardtail', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 6 String Hardtail Bridge (string-through)', url: `${hs}/6-string-hardtail-guitar-bridge`, price: 125.4, from: true, verified: true, bridge: { type: 'hardtail', strings: [6] } },
  { id: 'hs-toneamatic', vendor: 'hipshot', category: 'bridge', name: 'Hipshot Tone-A-Matic Bridge + Tailpiece', url: `${hs}/6-string-tone-a-matic-guitar-bridge-metric-right-handed`, price: 197.56, verified: true, bridge: { type: 'tom', strings: [6] } },
  { id: 'hs-toneamatic7', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 7 String Tone-A-Matic Bridge + Tailpiece', url: `${hs}/7-string-tone-a-matic-guitar-bridge-metric`, price: 230.0, verified: false, note: 'Listed from $108.24 to $282.48 depending on parts; bridge+tailpiece price estimated', bridge: { type: 'tom', strings: [7] } },
  { id: 'hs-babygrand', vendor: 'hipshot', category: 'bridge', name: 'Hipshot BabyGrand Bridge', url: `${hs}/babygrand-guitar-bridge-right-handed`, price: 184.8, from: true, verified: true, bridge: { type: 'tom', strings: [6] } },
  { id: 'hs-6screw', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 6-Screw Synchronized Tremolo (stainless)', url: `${hs}/6-screw-stainless-tremolo-bridge`, price: 184.8, verified: true, bridge: { type: 'vintage-trem', strings: [6] } },
  { id: 'hs-contour', vendor: 'hipshot', category: 'bridge', name: 'Hipshot US Contour 2-Point Tremolo', url: `${hs}/6-string-us-contour-tremolo-bridge`, price: 198.0, verified: true, bridge: { type: 'two-point-trem', strings: [6] } },
  { id: 'hs-contour7', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 7 String US Contour Tremolo', url: `${hs}/7-string-us-contour-tremolo-bridge-right-handed`, price: 355.08, from: true, verified: true, bridge: { type: 'two-point-trem', strings: [7] } },
  { id: 'hs-tele', vendor: 'hipshot', category: 'bridge', name: 'Hipshot Telecaster-style Retrofit Bridge', url: `${hs}/telecaster-retrofit-bridge`, price: 158.4, verified: true, bridge: { type: 'tele', strings: [6] } },
  { id: 'hs-headless-fixed', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 6 String Headless Fixed (bridge + LowPro headpiece)', url: `${hs}/6-string-guitar-headless-system`, price: 433.1, verified: true, bridge: { type: 'headless-fixed', strings: [6] } },
  { id: 'hs-headless-trem', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 6 String Headless Tremolo (bridge + LowPro headpiece)', url: `${hs}/6-string-guitar-headless-tremolosystem`, price: 471.93, verified: true, bridge: { type: 'headless-trem', strings: [6] } },
  { id: 'hs-headless-fixed7', vendor: 'hipshot', category: 'bridge', name: 'Hipshot 7 String Headless Fixed (bridge + headpiece)', url: `${hs}/7-string-guitar-headless-system`, price: 520.0, verified: false, note: 'Listed $93.85–$549.58 depending on parts; full-set price estimated', bridge: { type: 'headless-fixed', strings: [7] } },
  { id: 'fr-original', vendor: 'floyd', category: 'bridge', name: 'Floyd Rose Original Tremolo System', url: `${fr}/frto`, price: 266.0, from: true, verified: true, note: 'Includes locking nut. Needs a recessed route.', bridge: { type: 'floyd', strings: [6] } },
  { id: 'fr-original7', vendor: 'floyd', category: 'bridge', name: 'Floyd Rose Original 7-String Tremolo System', url: `${fr}/frt7`, price: 251.5, from: true, verified: true, bridge: { type: 'floyd', strings: [7] } },
  { id: 'fr-1000', vendor: 'floyd', category: 'bridge', name: 'Floyd Rose 1000 Series Original Style Tremolo', url: `${fr}/1000-series-original-style-tremolo-system`, price: 160.0, from: true, verified: true, bridge: { type: 'floyd', strings: [6] } },
  { id: 'fr-1000-7', vendor: 'floyd', category: 'bridge', name: 'Floyd Rose 1000 Series 7 String Tremolo', url: `${fr}/1000-series-original-style-7-string-tremolo-system`, price: 169.0, from: true, verified: true, bridge: { type: 'floyd', strings: [7] } },
  { id: 'fr-special', vendor: 'floyd', category: 'bridge', name: 'Floyd Rose Special Tremolo System', url: `${fr}/frts`, price: 92.0, from: true, verified: true, note: 'Listed $92–$149 by option', bridge: { type: 'floyd', strings: [6] } },
  { id: 'fr-frx', vendor: 'floyd', category: 'bridge', name: 'Floyd Rose FRX Top-Mount Tremolo', url: `${fr}/frtx`, price: 310.0, from: true, verified: true, note: 'Fits standard tune-o-matic post holes; no deep route', bridge: { type: 'floyd', strings: [6] } },
  { id: 'fr-railtail', vendor: 'floyd', category: 'bridge', name: 'Floyd Rose Rail Tail Tremolo (narrow)', url: `${fr}/rtn`, price: 301.0, from: true, verified: true, bridge: { type: 'vintage-trem', strings: [6] } },

  // ---------------------------------------------------------------- NUTS
  { id: 'fr-nut-original', vendor: 'floyd', category: 'nut', name: 'Floyd Rose Original Locking Nut', url: 'https://www.floydrose.com/products/original-locking-nut', price: 34.2, verified: true },
  { id: 'fr-nut-1000', vendor: 'floyd', category: 'nut', name: 'Floyd Rose 1000 Series / Special Locking Nut', url: 'https://www.floydrose.com/products/1000-series-special-locking-nut-2', price: 28.0, verified: true },
  { id: 'fr-nut-7', vendor: 'floyd', category: 'nut', name: 'Floyd Rose 7-String 1000 Series / Special Locking Nut', url: 'https://www.floydrose.com/products/7-string-1000-series-special-locking-nut', price: 34.0, verified: true },
  { id: 'sm-nut-bone', vendor: 'stewmac', category: 'nut', name: 'Unbleached Bone Nut Blank', url: `${sm}/luthier-tools-and-supplies/materials/nuts-and-saddles/unbleached-bone-nuts`, price: 4.49, from: true, verified: true },
  { id: 'sm-nut-bone-bleached', vendor: 'stewmac', category: 'nut', name: 'Bleached White Bone Nut Blank', url: `${sm}/luthier-tools-and-supplies/materials/nuts-and-saddles/bleached-white-bone-nuts`, price: 3.89, from: true, verified: true },
  { id: 'sm-nut-tusq', vendor: 'stewmac', category: 'nut', name: 'Graph Tech TUSQ Nut', url: `${sm}/luthier-tools-and-supplies/materials/nuts-and-saddles/tusq-nuts`, price: 12.13, from: true, verified: true },
  { id: 'sm-nut-tusq-black', vendor: 'stewmac', category: 'nut', name: 'Graph Tech Black TUSQ XL Nut', url: `${sm}/luthier-tools-and-supplies/materials/nuts-and-saddles/black-tusq-xl-nuts`, price: 13.28, from: true, verified: true },
  { id: 'sm-nut-blackbone', vendor: 'stewmac', category: 'nut', name: 'Black Bone Nut Blank', url: `${sm}/luthier-tools-and-supplies/materials/nuts-and-saddles/black-bone-nut-blank`, price: 8.99, verified: true },

  // ---------------------------------------------------------------- TUNERS
  { id: 'hs-tuners-6il-griplock', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Grip-Lock Open Tuner Kit, 6-in-line (10mm)', url: `${hs}/guitar-tuner-upgrade-kits`, price: 128.88, verified: true, tuners: { layout: 'inline', strings: 6 } },
  { id: 'hs-tuners-6il-classic', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Classic Open Tuner Kit, 6-in-line (10mm)', url: `${hs}/guitar-tuner-upgrade-kits`, price: 113.78, verified: true, tuners: { layout: 'inline', strings: 6 } },
  { id: 'hs-tuners-6il-vintage', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Vintage Tuner Kit, 6-in-line (8.5mm)', url: `${hs}/vintage-guitar-tuner-upgrade-kit-6-inline-headstocks`, price: 142.48, from: true, verified: true, tuners: { layout: 'inline', strings: 6 } },
  { id: 'sm-tuners-6il-griplock', vendor: 'stewmac', category: 'tuners', name: 'Hipshot Grip-Lock Open Gear 6-in-Line Kit (StewMac)', url: `${sm}/shop-by-brand/hipshot/hipshot-grip-lock-open-gear-6-in-line-tuner-upgrade-kit`, price: 87.49, verified: true, tuners: { layout: 'inline', strings: 6 } },
  { id: 'sm-tuners-6il-closed', vendor: 'stewmac', category: 'tuners', name: 'Hipshot Grip-Lock Closed Gear 6-in-Line Kit (StewMac)', url: `${sm}/shop-by-brand/hipshot/hipshot-grip-lock-closed-gear-6-in-line-tuner-upgrade-kit`, price: 97.99, verified: true, tuners: { layout: 'inline', strings: 6 } },
  { id: 'hs-tuners-33-griplock', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Grip-Lock Open Tuner Kit, 3+3 (10mm)', url: `${hs}/guitar-tuner-upgrade-kits-3-3-headstocks`, price: 135.13, verified: true, tuners: { layout: 'split', strings: 6 } },
  { id: 'hs-tuners-33-griplock-closed', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Grip-Lock Closed Tuner Kit, 3+3 (10mm)', url: `${hs}/guitar-tuner-upgrade-kits-3-3-headstocks`, price: 137.05, verified: true, tuners: { layout: 'split', strings: 6 } },
  { id: 'hs-tuners-33-classic', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Classic Open Tuner Kit, 3+3 (10mm)', url: `${hs}/guitar-tuner-upgrade-kits-3-3-headstocks`, price: 110.35, verified: true, tuners: { layout: 'split', strings: 6 } },
  { id: 'hs-tuners-33-vintage', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Vintage Tuner Kit, 3+3 (8.5mm)', url: `${hs}/vintage-guitar-tuner-upgrade-kits-3-3-headstocks`, price: 148.33, from: true, verified: true, tuners: { layout: 'split', strings: 6 } },
  { id: 'hs-tuner-griplock-each', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Grip-Lock Open Tuning Machine (each)', url: `${hs}/grip-lock-open-guitar-tuning-machines`, price: 21.4, from: true, verified: true, tuners: { layout: 'single' } },
  { id: 'hs-tuner-classic-each', vendor: 'hipshot', category: 'tuners', name: 'Hipshot Classic Open Tuning Machine (each)', url: `${hs}/classic-open-guitar-tuning-machines`, price: 16.13, from: true, verified: true, tuners: { layout: 'single' } },

  // ---------------------------------------------------------------- FRETS / TRUSS / INLAY
  { id: 'sm-fret-medium', vendor: 'stewmac', category: 'frets', name: 'StewMac Medium Fretwire (2 ft length)', url: `${sm}/luthier-tools-and-supplies/materials/fretwire/stewmac-medium-fretwire`, price: 5.99, from: true, verified: true },
  { id: 'sm-fret-narrow', vendor: 'stewmac', category: 'frets', name: 'StewMac Narrow Fretwire (2 ft length)', url: `${sm}/luthier-tools-and-supplies/materials/fretwire/stewmac-narrow-fretwire`, price: 4.99, from: true, verified: true },
  { id: 'sm-fret-wide', vendor: 'stewmac', category: 'frets', name: 'StewMac Wide (Jumbo) Fretwire (2 ft length)', url: `${sm}/luthier-tools-and-supplies/materials/fretwire/stewmac-wide-fretwire`, price: 6.99, from: true, verified: true },
  { id: 'sm-fret-ss', vendor: 'stewmac', category: 'frets', name: 'StewMac Stainless Steel Fretwire (2 ft length)', url: `${sm}/luthier-tools-and-supplies/materials/fretwire/stewmac-stainless-steel-fretwire`, price: 8.99, from: true, verified: true },
  { id: 'sm-fret-gold', vendor: 'stewmac', category: 'frets', name: 'StewMac Gold Fretwire (2 ft length)', url: `${sm}/luthier-tools-and-supplies/materials/fretwire/stewmac-gold-fretwire`, price: 7.99, from: true, verified: true },
  { id: 'sm-truss-lowpro', vendor: 'stewmac', category: 'truss', name: 'Hot Rod Low-profile 2-Way Truss Rod', url: `${sm}/luthier-tools-and-supplies/materials/truss-rods/hot-rod-low-profile-2-way-truss-rod`, price: 11.29, verified: true },
  { id: 'sm-truss-spoke', vendor: 'stewmac', category: 'truss', name: 'Spoke Wheel Nut Hot Rod Truss Rod', url: `${sm}/luthier-tools-and-supplies/materials/truss-rods/spoke-nut-hot-rod-truss-rod`, price: 25.79, from: true, verified: true },
  { id: 'sm-truss-allen', vendor: 'stewmac', category: 'truss', name: '4mm Allen Nut Hot Rod Truss Rod', url: `${sm}/luthier-tools-and-supplies/materials/truss-rods/4mm-allen-nut-hot-rod-truss-rod`, price: 33.49, from: true, verified: true },
  { id: 'sm-carbon-rods', vendor: 'stewmac', category: 'truss', name: 'Carbon Fiber Neck Rods', url: `${sm}/luthier-tools-and-supplies/materials/truss-rods/carbon-fiber-neck-rods`, price: 21.09, from: true, verified: true },
  { id: 'sm-dot-pearl', vendor: 'stewmac', category: 'inlay', name: 'Pearl Dots', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/pearl-dots`, price: 0.59, verified: true },
  { id: 'sm-dot-abalone', vendor: 'stewmac', category: 'inlay', name: 'Abalone Dots', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/abalone-dots`, price: 0.59, verified: true },
  { id: 'sm-dot-goldpearl', vendor: 'stewmac', category: 'inlay', name: 'Gold Pearl Dots', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/gold-pearl-dots`, price: 0.59, verified: true },
  { id: 'sm-dot-black', vendor: 'stewmac', category: 'inlay', name: 'Black Plastic Dots', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/black-plastic-dots`, price: 0.59, verified: true },
  { id: 'sm-dot-clay', vendor: 'stewmac', category: 'inlay', name: 'Clay Dot', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/clay-dot`, price: 1.39, verified: true },
  { id: 'sm-dot-pearloid', vendor: 'stewmac', category: 'inlay', name: 'Pearloid Dot', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/pearloid-dot`, price: 0.49, from: true, verified: true },
  { id: 'sm-diamond-abalone', vendor: 'stewmac', category: 'inlay', name: 'Abalone Diamonds', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/abalone-diamonds`, price: 2.59, verified: true },
  { id: 'sm-diamond-pearl', vendor: 'stewmac', category: 'inlay', name: 'Pearl Diamonds', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/pearl-diamonds`, price: 2.19, from: true, verified: true },
  { id: 'sm-pearl-blank', vendor: 'stewmac', category: 'inlay', name: 'Pearl Inlay Blank (cut your own shapes)', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/pearl-inlay-blank`, price: 9.89, from: true, verified: true },
  { id: 'sm-sidedots-pearl', vendor: 'stewmac', category: 'inlay', name: 'Pearl Fretboard Side Dots', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/pearl-fretboard-side-dots`, price: 3.59, verified: true },
  { id: 'sm-sidedots-pearloid', vendor: 'stewmac', category: 'inlay', name: 'Pearloid Fretboard Side Dots (10 pack)', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/pearloid-fretboard-side-dots-package-of-10`, price: 2.59, verified: true },
  { id: 'sm-abalone-purfling', vendor: 'stewmac', category: 'inlay', name: 'Paua Abalone Purfling', url: `${sm}/luthier-tools-and-supplies/materials/inlay-and-pearl/paua-abalone-purfling`, price: 25.69, from: true, verified: true },

  // ---------------------------------------------------------------- ELECTRONICS
  { id: 'sm-pot-cts', vendor: 'stewmac', category: 'electronics', name: 'CTS Control Pot (250k for single coils / 500k for humbuckers)', url: `${sm}/electronics/components-and-parts/potentiometers/cts-control-pots`, price: 7.99, from: true, verified: true },
  { id: 'sm-pot-pushpull', vendor: 'stewmac', category: 'electronics', name: 'CTS Push-pull Pot, DPDT (coil split)', url: `${sm}/electronics/components-and-parts/potentiometers/cts-push-pull-pots-dpdt`, price: 9.99, from: true, verified: true },
  { id: 'sm-sw-toggle', vendor: 'stewmac', category: 'electronics', name: 'Switchcraft 3-way Toggle Switch', url: `${sm}/electronics/components-and-parts/switches/switchcraft-toggle-switches`, price: 29.99, from: true, verified: true },
  { id: 'sm-sw-5way', vendor: 'stewmac', category: 'electronics', name: 'CRL 5-way Lever Switch', url: `${sm}/electronics/components-and-parts/switches/crl-5-way-lever-switch`, price: 17.19, verified: true },
  { id: 'sm-sw-super', vendor: 'stewmac', category: 'electronics', name: 'Oak Grigsby Super Switch (5-way, 4-pole)', url: `${sm}/electronics/components-and-parts/switches/oak-grigsby-super-switch`, price: 23.69, verified: true },
  { id: 'sm-sw-3way-blade', vendor: 'stewmac', category: 'electronics', name: 'AxLabs Lever Switch (set to 3-way)', url: `${sm}/electronics/components-and-parts/switches/axlabs-5-way-lever-switch`, price: 13.0, from: true, verified: true },
  { id: 'sm-jack', vendor: 'stewmac', category: 'electronics', name: 'Switchcraft Output Jack', url: `${sm}/electronics/components-and-parts/jacks/switchcraft-output-jack`, price: 4.59, from: true, verified: true },
  { id: 'sm-cap-od', vendor: 'stewmac', category: 'electronics', name: 'Orange Drop Tone Capacitor', url: `${sm}/electronics/components-and-parts/capacitors-and-resistors/orange-drop-caps`, price: 4.99, verified: true },
  { id: 'sm-treble-bleed', vendor: 'stewmac', category: 'electronics', name: 'Golden Age Treble Bleed Circuit', url: `${sm}/electronics/components-and-parts/capacitors-and-resistors/golden-age-treble-bleed-circuit`, price: 10.79, from: true, verified: true },
  { id: 'sm-wire', vendor: 'stewmac', category: 'electronics', name: 'Vintage Stranded Core Push-back Wire (50 ft)', url: `${sm}/electronics/components-and-parts/wires/vintage-stranded-core-push-back-wire---50-feet`, price: 29.79, verified: true },
  { id: 'sm-wire-shielded', vendor: 'stewmac', category: 'electronics', name: 'Shielded Push-back Wire (16 in, for the jack)', url: `${sm}/electronics/components-and-parts/wires/shielded-push-back-wire---16-inches`, price: 3.29, verified: true },
  { id: 'sm-copper-tape', vendor: 'stewmac', category: 'electronics', name: 'Conductive Copper Shielding Tape', url: `${sm}/electronics/shielding/conductive-copper-tape`, price: 7.19, from: true, verified: true },
  { id: 'sm-pg-shield', vendor: 'stewmac', category: 'electronics', name: 'Pickguard Shielding Foil', url: `${sm}/electronics/shielding/pickguard-shielding-foil`, price: 9.89, verified: true },
  { id: 'sm-hb-rings', vendor: 'stewmac', category: 'plates', name: 'Humbucker Mounting Ring (each)', url: `${sm}/search/?q=humbucker+mounting+ring`, price: 6.5, verified: false, note: 'Price estimated; pick flat/slanted height on the page' },

  // ---------------------------------------------------------------- JACK MOUNTS / KNOBS / STRAP
  { id: 'sm-electrosocket', vendor: 'stewmac', category: 'plates', name: 'Electrosocket Jack Mount', url: `${sm}/parts-and-hardware/jack-plates/electrosocket-jack-mount`, price: 9.89, from: true, verified: true },
  { id: 'sm-jackplate-strat', vendor: 'stewmac', category: 'plates', name: 'Gotoh Jack Plate for S-style (top-angled)', url: `${sm}/parts-and-hardware/jack-plates/jack-plate-for-strat`, price: 12.29, from: true, verified: true },
  { id: 'sm-jackcup-tele', vendor: 'stewmac', category: 'plates', name: 'Jack Cup for T-style', url: `${sm}/parts-and-hardware/jack-plates/jack-cup-for-tele`, price: 6.69, verified: true },
  { id: 'sm-jackplate-lp', vendor: 'stewmac', category: 'plates', name: 'Gotoh Jack Plate for LP-style', url: `${sm}/parts-and-hardware/jack-plates/metal-jack-plate-for-gibsonsupregsup-les-paulsupregsup`, price: 7.19, from: true, verified: true },
  { id: 'sm-knob-dome', vendor: 'stewmac', category: 'knobs', name: 'Gotoh Dome Knob', url: `${sm}/parts-and-hardware/knobs/dome-knob`, price: 4.49, from: true, verified: true },
  { id: 'sm-knob-speed', vendor: 'stewmac', category: 'knobs', name: 'Speed Knob', url: `${sm}/parts-and-hardware/knobs/speed-knob`, price: 5.69, verified: true },
  { id: 'sm-knob-tophat', vendor: 'stewmac', category: 'knobs', name: 'Top Hat Bell Knob', url: `${sm}/parts-and-hardware/knobs/top-hat-bell-knob`, price: 4.09, verified: true },
  { id: 'sm-knob-flat', vendor: 'stewmac', category: 'knobs', name: 'Flat-top Knob', url: `${sm}/parts-and-hardware/knobs/flat-top-knob`, price: 6.15, from: true, verified: true },
  { id: 'sm-knob-strat', vendor: 'stewmac', category: 'knobs', name: 'S-style Skirted Knob', url: `${sm}/parts-and-hardware/knobs/strat-knob`, price: 2.79, from: true, verified: true },
  { id: 'hs-knob-oring', vendor: 'hipshot', category: 'knobs', name: 'Hipshot O Ring Knob', url: `${hs}/o-ring-knobs`, price: 10.3, from: true, verified: true },
  { id: 'sm-toggle-tip', vendor: 'stewmac', category: 'knobs', name: 'Toggle Switch Knob', url: `${sm}/parts-and-hardware/knobs/toggle-switch-knob`, price: 1.59, from: true, verified: true },
  { id: 'sm-toggle-plate', vendor: 'stewmac', category: 'knobs', name: 'Toggle Switch Plate', url: `${sm}/parts-and-hardware/knobs/toggle-switch-plate`, price: 1.99, verified: true },
  { id: 'sm-strap-gotoh', vendor: 'stewmac', category: 'strap', name: 'Gotoh Strap Buttons', url: `${sm}/parts-and-hardware/strap-buttons/strap-buttons`, price: 3.89, from: true, verified: true },
  { id: 'sm-strap-schaller', vendor: 'stewmac', category: 'strap', name: 'Schaller S-Locks', url: `${sm}/parts-and-hardware/strap-buttons/schaller-s-locks`, price: 21.29, from: true, verified: true },
  { id: 'sm-strap-dunlop', vendor: 'stewmac', category: 'strap', name: 'Dunlop Straplok System', url: `${sm}/parts-and-hardware/strap-buttons/dunlop-straplok-system`, price: 20.99, verified: true },
  { id: 'hs-ferrule', vendor: 'hipshot', category: 'plates', name: 'Hipshot String Ferrule (each, string-through)', url: `${hs}/guitar-string-ferrules`, price: 2.64, from: true, verified: true },
  { id: 'sm-neckplate', vendor: 'stewmac', category: 'plates', name: 'Neck Plate + Mounting Screws', url: `${sm}/search/?q=neck+plate`, price: 14.0, verified: false, note: 'Price estimated' },
  { id: 'sm-cavity-cover', vendor: 'stewmac', category: 'plates', name: 'Control / Tremolo Cavity Cover Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/black-pickguard-material`, price: 13.89, from: true, verified: true, note: 'Cut covers from a sheet of black pickguard material' },
  { id: 'sm-truss-cover', vendor: 'stewmac', category: 'plates', name: 'Truss Rod Cover (cut from pickguard stock)', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/black-and-white-laminated-pickguard-materials`, price: 26.19, from: true, verified: true, note: 'One sheet makes truss cover and cavity covers' },

  // ---------------------------------------------------------------- PICKGUARD MATERIAL
  { id: 'sm-pg-black', vendor: 'stewmac', category: 'pickguard', name: 'Black Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/black-pickguard-material`, price: 13.89, from: true, verified: true },
  { id: 'sm-pg-white', vendor: 'stewmac', category: 'pickguard', name: 'White Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/white-pickguard-material`, price: 13.89, from: true, verified: true },
  { id: 'sm-pg-cream', vendor: 'stewmac', category: 'pickguard', name: 'Cream Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/cream-pickguard-material`, price: 14.89, verified: true },
  { id: 'sm-pg-bwb', vendor: 'stewmac', category: 'pickguard', name: 'Black/White/Black Laminated Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/black-and-white-laminated-pickguard-materials`, price: 26.19, from: true, verified: true },
  { id: 'sm-pg-wbw', vendor: 'stewmac', category: 'pickguard', name: 'White/Black/White Laminated Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/whitebw-laminated-pickguard-materials`, price: 20.49, verified: true },
  { id: 'sm-pg-tortoise', vendor: 'stewmac', category: 'pickguard', name: 'Tortoise/M/B/M Laminated Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/tortoisembm-laminated-pickguard-materials`, price: 35.89, verified: true },
  { id: 'sm-pg-pearloid', vendor: 'stewmac', category: 'pickguard', name: 'Pearloid/W/B/M Laminated Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/pearloidwbm-laminated-pickguard-materials`, price: 47.69, verified: true },
  { id: 'sm-pg-clear', vendor: 'stewmac', category: 'pickguard', name: 'Clear Pickguard Material', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/clear-pickguard-material`, price: 7.59, from: true, verified: true },
  { id: 'sm-pg-5ply', vendor: 'stewmac', category: 'pickguard', name: '5-ply Pickguard Material (mint / parchment style)', url: `${sm}/luthier-tools-and-supplies/materials/pickguard-materials/5-ply-pickguard-material`, price: 35.89, verified: true },

  // ---------------------------------------------------------------- FINISHING
  { id: 'sm-stain', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Liquid Stain (pick colour)', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-liquid-stains`, price: 29.99, verified: true },
  { id: 'sm-lacquer-clear', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Aerosol Guitar Lacquer, Clear', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-aerosol-guitar-lacquer`, price: 24.99, verified: true, note: 'Choose gloss or satin sheen on the page' },
  { id: 'sm-lacquer-aged', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Aerosol Guitar Lacquer, Aged Clear', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-aerosol-guitar-lacquer-aged-clear`, price: 24.99, verified: true },
  { id: 'sm-lacquer-color', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Aerosol Guitar Lacquer, Colour (solid / metallic)', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-aerosol-guitar-lacquer`, price: 24.99, verified: true, note: 'Pick the closest colour on the page' },
  { id: 'sm-lacquer-amber', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Tinted Aerosol Lacquer, Vintage Amber', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-aerosol-guitar-lacquer-vintage-amber`, price: 24.99, verified: true },
  { id: 'sm-lacquer-tobacco', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Tinted Aerosol Lacquer, Tobacco Brown (bursts)', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-aerosol-guitar-lacquer-tobacco-brown`, price: 24.99, verified: true },
  { id: 'sm-lacquer-cherry', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Tinted Aerosol Lacquer, Heritage Cherry (bursts)', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-tinted-aerosol-guitar-lacquer`, price: 24.99, verified: true },
  { id: 'sm-sealer', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Aerosol Guitar Lacquer Sealer', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-aerosol-guitar-lacquer-sealer`, price: 24.99, verified: true },
  { id: 'sm-primer', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Aerosol Guitar Primer by Nitorlack', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-aerosol-guitar-primer-by-nitorlack`, price: 27.99, verified: true },
  { id: 'sm-grainfiller', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Powdered Grain Filler', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-powdered-grain-filler`, price: 23.59, verified: true },
  { id: 'sm-wipeon-poly', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Wipe-On Poly Finish', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-wipe-on-poly-finish`, price: 27.69, verified: true },
  { id: 'sm-fb-oil', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Fretboard Finishing Oil', url: `${sm}/luthier-tools-and-supplies/supplies/finishing-supplies/colortone-fretboard-finishing-oil`, price: 30.49, verified: true },
  { id: 'sm-polish', vendor: 'stewmac', category: 'finishing', name: 'ColorTone Polishing Compounds', url: `${sm}/luthier-tools-and-supplies/supplies/sanding-and-polishing/colortone-polishing-compounds`, price: 16.69, from: true, verified: true },
  { id: 'sm-micromesh', vendor: 'stewmac', category: 'finishing', name: 'Micro-Mesh Soft Touch Pads', url: `${sm}/luthier-tools-and-supplies/supplies/sanding-and-polishing/micro-mesh-soft-touch-pads`, price: 17.59, from: true, verified: true },
  { id: 'sm-sandpaper', vendor: 'stewmac', category: 'supplies', name: 'Eagle Abrasives Sheets (one per grit: 120–600)', url: `${sm}/luthier-tools-and-supplies/supplies/sanding-and-polishing/eagle-abrasives-sheets`, price: 2.99, from: true, verified: true },
  { id: 'sm-tape', vendor: 'stewmac', category: 'supplies', name: 'Low Tack Protective Masking Tape', url: `${sm}/luthier-tools-and-supplies/supplies/glue-and-adhesive/low-tack-protective-tape`, price: 6.99, from: true, verified: true },
  { id: 'sm-superglue', vendor: 'stewmac', category: 'supplies', name: 'StewMac Super Glue (frets, inlays, nut)', url: `${sm}/luthier-tools-and-supplies/supplies/glue-and-adhesive/stewmac-super-glue`, price: 11.79, verified: true },
  { id: 'sm-woodglue', vendor: 'stewmac', category: 'supplies', name: 'Wood Glue for tops, fretboard, set necks (Titebond-type)', url: `${sm}/search/?q=titebond`, price: 9.0, verified: false, note: 'Price estimated' },
  { id: 'sm-pg-adhesive', vendor: 'stewmac', category: 'supplies', name: '3M Pickguard Adhesive Sheet', url: `${sm}/luthier-tools-and-supplies/supplies/glue-and-adhesive/3m-pickguard-adhesive-sheet`, price: 4.19, verified: true },
  { id: 'sm-decal-paper', vendor: 'stewmac', category: 'supplies', name: 'Waterslide Decal Paper (for logos & graphics)', url: `${sm}/search/?q=decal`, price: 12.0, verified: false, note: 'Price estimated; any clear waterslide inkjet/laser paper works' },
  { id: 'sm-strings', vendor: 'stewmac', category: 'strings', name: 'Electric Guitar Strings (set)', url: `${sm}/search/?q=electric+guitar+strings`, price: 7.5, verified: false, note: 'Price estimated' },
]

export const PRODUCTS: Record<string, Product> = Object.fromEntries(P.map((p) => [p.id, p]))
export const PRODUCT_LIST = P

export function product(id: string): Product | undefined {
  return PRODUCTS[id]
}

export function pickupsFor(type: string, strings: number): Product[] {
  return P.filter((p) => p.pickup && p.pickup.type === type && (strings === 6 || p.pickup.seven))
}

export function bridgesFor(type: string, strings: number): Product[] {
  return P.filter((p) => p.bridge && p.bridge.type === type && p.bridge.strings.includes(strings))
}

export function tunersFor(layout: 'inline' | 'split' | 'none', strings: number): Product[] {
  if (layout === 'none') return []
  if (strings !== 6) return P.filter((p) => p.tuners?.layout === 'single')
  return P.filter((p) => p.tuners && (p.tuners.layout === layout || p.tuners.layout === 'single'))
}
