"""Convert a DXF drawing into a true-scale SVG for public/plans.

  python3 tools/body-sources/dxf2plan.py in.dxf out.svg [--crop x0,y0,x1,y1] [--units in|mm]

Coordinates stay in drawing units (y flipped for SVG); width/height are written in
millimetres so the file prints and loads at 1:1. Units come from $INSUNITS, or are
guessed from the drawing size. Prints the mmPerUnit to put in src/data/plans.ts.
"""
import math, os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'shape-tracer'))
from dxf import entities  # noqa: E402

UNITS = {1: 25.4, 4: 1.0, 5: 10.0, 2: 304.8, 6: 1000.0}


def insunits(text):
    m = re.search(r'\n\s*9\s*\n\$INSUNITS\s*\n\s*70\s*\n\s*(\d+)', text)
    return int(m.group(1)) if m else None


def main():
    args = sys.argv[1:]
    src, out = args[0], args[1]
    crop = None
    force = None
    if '--crop' in args:
        crop = [float(v) for v in args[args.index('--crop') + 1].split(',')]
    if '--units' in args:
        force = args[args.index('--units') + 1]
    text = open(src, errors='ignore').read()
    ents = entities(text)
    polys = []
    for e in ents:
        pts = [p for p in e['pts'] if p[0] is not None and p[1] is not None]
        if len(pts) < 2:
            continue
        if crop and not all(crop[0] <= x <= crop[2] and crop[1] <= y <= crop[3] for x, y in pts):
            continue
        polys.append((e['layer'] or '0', e['type'], pts))
    xs = [x for _, _, ps in polys for x, _ in ps]
    ys = [y for _, _, ps in polys for _, y in ps]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = x1 - x0, y1 - y0
    code = insunits(text)
    if force:
        k = 25.4 if force == 'in' else 1.0
    elif code in UNITS:
        k = UNITS[code]
    else:
        k = 25.4 if max(w, h) < 80 else 1.0
    pad = max(w, h) * 0.01
    x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    w, h = x1 - x0, y1 - y0
    layers = {}
    for layer, typ, pts in polys:
        d = ' '.join(('M' if i == 0 else 'L') + f'{x:.4f},{-y:.4f}' for i, (x, y) in enumerate(pts))
        layers.setdefault(layer, []).append(f'<path d="{d}" data-type="{typ}"/>')
    sw = 0.25 / k  # 0.25 mm hairline in drawing units
    body = ''.join(f'<g data-layer="{l}">{"".join(p)}</g>' for l, p in layers.items())
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.4f} {-y1:.4f} {w:.4f} {h:.4f}" '
           f'width="{w * k:.2f}mm" height="{h * k:.2f}mm">'
           f'<g fill="none" stroke="#000" stroke-width="{sw:.5f}" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>')
    open(out, 'w').write(svg)
    print(f'{out}: {len(polys)} entities, {w * k:.0f} x {h * k:.0f} mm, mmPerUnit {k} ($INSUNITS={code}), box {x0:.4f} {-y1:.4f} {w:.4f} {h:.4f}')


if __name__ == '__main__':
    main()
