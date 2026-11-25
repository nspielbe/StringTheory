# Body, headstock and pickguard sources (dev tools)

Every built-in body, headstock and pickguard in `src/data/bodyShapes.ts` and `src/data/headstockShapes.ts` is traced from a full-size plan in the plan library (`public/plans`, listed in `src/data/plans.ts`). Each template has a `source` field naming that plan and saying how the bridge line was placed. The app shows a "Traced from …" link under the shape pickers.

## Sources

| Shape | Plan | Bridge line from |
| --- | --- | --- |
| S-style body, headstock, guard | `s-full-cad` (DXF) | its 21 fret slots (649.45 mm scale fit, 0.015 mm residual) |
| T-style body, guard | `t-body-cad` (DXF) | the Fender 4-bolt neck pattern, measured on the S-style plan (rows 195.9 / 246.9 mm in front of the saddle) |
| T-style headstock | `t-neck-top-final` (your laser SVG, mirrored to the front) | its nut line |
| LP-style body, 3+3 headstock | `lp-full-cad` (DXF) | its frets (628.66 mm, 0.007 mm residual) |
| SG-style body | `sg-full-cad` (DXF) | its frets |
| Reverse body and headstock | `reverse-full-cad` (DXF) | its frets |
| Offset body, guard | `offset-body-routes` (PDF, rendered at 6 px/mm) | its neck bolt holes; the bridge-post holes land 0.7 mm behind that line |
| V-style body, headstock | `v-58-plan` (PDF) | its nut and 12th-fret marks, 314.3 mm apart |
| X-style body, headstock | `x-76-plan` (PDF) | its nut (24.75" scale); matches the drawn bridge posts |
| PRS-style body, headstock | `prs-body-hairline` | its saddle and nut marks, 635 mm apart |
| Headless body | `headless-full-plan` | the middle string's saddle (the plan's neck is fanned) |

Neck widths (`nutWidth`, `taper` in each body's defaults) come from the fret-slot lengths in the same plans.

There's no super-S body: the RG drawing in the stash is 457 mm long, but the Jem factory blueprint gives 395 mm for that body family, so its scale can't be trusted. Electric Herald sells an RG550 DXF if you want one.

## Pipeline

All scripts read untrusted drawings, so run Python with `-I`.

1. **DXF → SVG**: `python3 -I dxf2plan.py in.dxf out.svg` keeps drawing units and writes the width and height in mm (units from `$INSUNITS`, or guessed).
2. **PDF → SVG**: compile `swiftc -O pdf2png.swift -o pdf2png`, then `./pdf2png in.pdf out.png 6` (6 px/mm), and `python3 -I png2svg.py out.png 6 plan.svg` wraps it in an SVG whose units are mm.
3. **Trace**: `python3 -I run.py plan.svg x,y,w,h trace.json [pxmm] [close] [open] [debug.png|-] [post] [thr] [frets|-] [holes|-] [seed]` rasterises the crop in headless Chrome, fills the silhouette from outside (or from a seed point, used for pickguards), and writes the contour. Optional: dark-line positions along the neck (raster frets), enclosed holes (tuners, pots, bolts) and the debug image.
4. **Frets**: `python3 -I analyze.py plan.svg trace.json right|left|up|down analysis.json` fits the CAD fret lines to the 12-TET spacing and gives the saddle position (unaffected by which fret is first).
5. **Body**: `python3 -I build.py trace.json analysis.json <neck> body.json [--saddle-u U] [--axis-v V] [--no-neck] [--smooth-at x,y,r] [--corner-deg D]` maps to body space (saddle at y = 0, bass at -x), cuts the neck at the pocket corners and fits Catmull-Rom points to within 0.35 mm. The curve is the same one `sampleOutline` draws.
6. **Headstock**: `python3 -I build_head.py trace.json <neck> nut_u axis_v head.json [--svg cad.svg | --holes holes.json] [--flip]` cuts at the nut and reads the tuner holes.
7. **Pickguard**: `python3 -I build_guard.py trace.json <neck> saddle_u axis_v guard.json --shift dx,dy` places a separately drawn guard and replaces its neck notch with pocket corners.
8. `python3 -I preview.py body.json out.svg` draws the trace, the fitted curve and the points so you can check them.

`holes.py` merges crosshair quarters back into round holes, and `rotwrap.py` rotates an angled plan (like a 45° neck) upright.
