# Plan library (dev notes)

Full-size SVG plans live in `public/plans/<style>/<id>.svg` and are listed in `src/data/plans.ts`. The app shows them under **Plans** and can put any body, headstock or neck plan behind the outline editor at true scale.

The files are kept exactly as drawn. Many sit in a corner of a 24" laser sheet, and a few are drawn off their page, so the app crops to each plan's `box` at load time (`src/lib/plans.ts` rewrites only the root `<svg>` tag).

## Adding a plan

1. Copy the SVG to `public/plans/<style>/<id>.svg`. Use a neutral id and title ("S-style", "PRS-style", "Dreadnought"), not trademark model names.
2. `python3 tools/plans/plans.py info public/plans/<style>/<id>.svg` prints `mmPerUnit` and `bytes`. Check the sheet size looks right (a body should come out around 320–460 mm).
3. With `npm run dev` running, paste `tools/plans/measure.js` into the browser console and run `await measurePlans(['<style>/<id>.svg'])` to get `box`.
4. Add the entry to `PLANS` in `src/data/plans.ts`. For body plans, `trace.focus` is the body outline's box (so it centres on the design) and `trace.rot` turns the neck to point up (`-90` when the neck points right).
5. `python3 tools/plans/plans.py thumbs <id>` renders `public/plans/thumbs/<id>.png` with headless Chrome.
