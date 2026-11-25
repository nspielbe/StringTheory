# Shape tracer (dev tool)

Turns a straight-on reference photo or drawing into an editable body outline in real millimetres.

1. Serve this folder: `python3 -m http.server 5199` and open http://127.0.0.1:5199
2. In the console: `await body('key', url, { h: 4000 })` traces the silhouette and cuts off the neck.
3. Frets set the true scale and bridge position: `fretRows` → `peaks` → `fretRun` → `fitFrets(ys, k0)` (k0 = 0 if the first line is the nut). Check that residuals stay under a few pixels.
4. `F.key = finalize('key', fit, scaleMm)` → `scaleF('key', publishedWidth / measuredWidth)` (corrects camera perspective) → `makeTemplate('key')` prints the points for `src/data/bodyShapes.ts`.

Done so far: S-style (Fender Strat Relic photo), T-style ('52 Tele photo), LP-style (Epiphone LP photo), all from Wikimedia Commons (CC BY-SA / CC BY). PRS-style and Strandberg-style were taken straight from the SVG plans in public/plans (exact geometry, no photo tracing).
Still to trace: SG (DXF plan), V and X styles (DXFs), offset (Jazzmaster photo), super-S (Ibanez RG / Jackson Soloist drawings), and all headstocks (Commons headstock SVG set: Fender normal/large/Tele, Gibson, PRS, Jackson, Ibanez).
