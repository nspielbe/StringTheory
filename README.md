# StringTheory — electric guitar designer

Design an electric guitar in the browser, see it in full 3D, render it, then get a priced shopping list of every raw part you need to build it.

## What it does

- **Body**: 10 starting shapes (Fender-style S, T and offset, Gibson-style LP and SG, PRS-style double cut, Super-S, Strandberg-style headless, V and X styles), or draw your own. The outline editor lets you drag points, add and delete them, make sharp corners, mirror one side to the other, stretch the whole shape, and trace over a photo. You can also move the knobs, switch, jack and strap buttons there.
- **Wood**: 33 tonewoods with procedural grain, including flame, quilt, birdseye, spalted, burl, ribbon and streaked figure. Bookmatched tops, 1/2/3-piece bodies, flat or carved caps, binding, natural-edge "faux binding", and neck-through stripes.
- **Finish**: set each surface separately (top, back and sides, neck, headstock face). Choose clear, transparent dye, burst, solid paint or metallic, in gloss, satin or oil, with an amber tint. There are 23 presets (sunbursts, cherry burst, trans colours, seafoam, candy red and more).
- **Neck**: scale (24"–27" or custom), 21/22/24 frets, 6 or 7 strings, bolt-on/set/neck-through, C/D/U/V profiles, depth at the 1st and 12th fret, nut width, taper, compound radius, neck angle, fret wire, nut material and truss rod access.
- **Headstock**: 7 shapes, or your own outline with draggable tuner rows. Also tilt angle, reversed headstocks and face veneers.
- **Inlays**: dots, offset dots, blocks, trapezoids, sharktooth, diamonds, moons and side triangles. Or use your own image at each fret or one image along the whole board, either as a picture or cut as a pearl or colour silhouette. Ten inlay materials, plus side dots.
- **Graphics**: upload images onto the body front, back, headstock or pickguard. Drag, scale and rotate them, crop them, mask to an oval or rounded shape, remove white backgrounds, shift hue/saturation/brightness, or render them as solid colour, pearl, abalone, gold leaf or chrome. Anything past the edge is cut off.
- **Pickups and electronics**: 11 layouts, with real models from Seymour Duncan, DiMarzio and Bare Knuckle. Cover colours, position and slant, pots, selector, push-pull, treble bleed, knob style, jack style and shielding.
- **Hardware**: Hipshot fixed, hardtail, Tone-A-Matic, tremolo, T-style and headless bridges; Floyd Rose tremolos; Hipshot tuners; strap locks; pickguards in nine materials.
- **Renders**: 9 camera angles, 4 backgrounds plus transparent, up to 4K, with a contact sheet.
- **Build sheet**: a live total cost, then a full editable parts list with vendor links, quantities, alternative products, "I already have this" toggles, CSV export and a print/PDF view. It also estimates finished weight.
- **1:1 templates**: an SVG with the body outline, neck pocket, pickup routes, control holes, headstock with tuner holes, pickguard and a fret-slot ruler.
- **Sharing**: designs save in the browser (IndexedDB) with an autosaved draft. Share a design as a link (no account needed) or export a `.guitar.json` file that carries the uploaded images.

## Where parts and prices come from

All catalog data is in `src/data/catalog.ts`. Prices were read from each store on **2026-11-24**. Every item links to its product page.

| Vendor | Used for |
| --- | --- |
| [StewMac](https://www.stewmac.com) | Body/neck blanks, fingerboards, fret wire, truss rods, nuts, inlay material, electronics, knobs, jack plates, pickguard stock, finishing supplies |
| [Exotic Wood Zone](https://exoticwoodzone.com) | Exotic and figured body blanks, drop/carved tops, neck blanks, fingerboards, headplates |
| [Hipshot](https://hipshotproducts.com) | Bridges, tuners, headless systems, ferrules, knobs |
| [Floyd Rose](https://www.floydrose.com) | Locking tremolos and nuts |
| [Seymour Duncan](https://www.seymourduncan.com), [DiMarzio](https://www.dimarzio.com), [Bare Knuckle](https://www.bareknucklepickups.co.uk) | Pickups (Bare Knuckle prices are GBP, converted at an editable rate) |

Note: **exoticwoods.com is now a parked domain** (a Network Solutions placeholder), so exotic and figured wood comes from Exotic Wood Zone. Figured tops are one-of-a-kind, so those links point to the collection page rather than a single board.

Items marked **estimate** in the app are prices that weren't shown directly on the store (a handful of small parts and a few sold-out woods). Any price or quantity can be overridden in the parts list. Your edits are saved with the design.

To refresh prices, edit `price` (and `verified`) in `src/data/catalog.ts` and update `PRICE_CHECKED`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5188
npm run build      # static site in dist/
```

## Put it online for other people

The build in `dist/` is a plain static site (no server or database), so any static host works:

- **Netlify / Vercel / Cloudflare Pages**: build command `npm run build`, output directory `dist`.
- **GitHub Pages**: push `dist/` to a `gh-pages` branch (the build uses relative paths, so it works from a sub-folder).

Each visitor's designs are stored in their own browser. They share designs by link or design file.

## Code map

```
src/
  data/          catalog (vendors, products, prices), woods, body/headstock/pickguard templates, presets
  lib/           geometry, layout (positions/heights), procedural wood (worker), texture baking,
                 parts list (bom.ts), persistence + share links, SVG templates
  three/         body mesh builder (rounded edges, carves, contours), neck/fretboard/headstock,
                 hardware, scene + render capture
  ui/            panels, outline editor, build sheet, modals
```

How the 3D surfaces are made: each surface (top, back, sides, neck, headstock face, fretboard, pickguard) is "baked" into a canvas measured in millimetres. Each bake layers the procedural grain, then the dye/burst/paint, then graphics and inlays, then the clear-coat tint. Sheen comes from the material (clearcoat and roughness). The body mesh is a grid triangulation clipped to the outline, with a rounded rim and deformers for carved tops, arm contours, belly cuts and bevels.

## Not built yet

- User accounts / a shared online gallery (designs are per-browser today)
- Multi-scale (fanned) frets, 8-string, bass
- Semi-hollow bodies with f-holes
- Live price refresh from the vendor sites
