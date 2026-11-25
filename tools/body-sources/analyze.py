"""analyze.py svg contour.json neck(right|left|up|down) out.json [neckHalfMm=28]
Finds frets -> scale + saddle, maps the traced silhouette to body space (bridge saddle at y=0,
neck along +y, bass side at -x), cuts the neck off at the pocket corners and fits control points."""
import json, math, re, sys

svgp, cp, neck, outp = sys.argv[1:5]
NECK_HALF = float(sys.argv[5]) if len(sys.argv) > 5 else 28.0
CROP = json.load(open(cp)).get('crop')
svg = open(svgp).read()
C = json.load(open(cp)); k = C['k']; P = C['pts']
paths = re.findall(r'<path d="([^"]+)" data-type="(\w+)"/>', svg)
def pts_of(d): return [tuple(map(float, t[1:].split(','))) for t in d.split(' ')]
# (u, v): u along the neck toward the nut, v across with bass side negative
def uv(p):
    x, y = p
    return {'right': (x, y), 'left': (-x, -y), 'up': (-y, x), 'down': (y, -x)}[neck]
lines = []
circles = []
for d, t in paths:
    raw = pts_of(d)
    if CROP and not all(CROP[0] <= x <= CROP[0] + CROP[2] and CROP[1] <= y <= CROP[1] + CROP[3] for x, y in raw):
        continue
    q = [uv(p) for p in raw]
    if t == 'LINE' and len(q) == 2:
        lines.append(q)
    if t in ('CIRCLE',) or (t == 'ARC' and math.dist(q[0], q[-1]) < 1e-6):
        cx = sum(p[0] for p in q) / len(q); cy = sum(p[1] for p in q) / len(q)
        r = sum(math.dist(p, (cx, cy)) for p in q) / len(q)
        circles.append((cx, cy, r))
# fret candidates: across-neck lines 38-62 mm long
cand = []
for a, b in lines:
    du, dv = b[0] - a[0], b[1] - a[1]
    L = math.hypot(du, dv) * k
    if 36 <= L <= 64 and abs(du) < 0.03 * abs(dv):
        cand.append(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, L))
vmed = sorted(c[1] for c in cand)[len(cand) // 2] if cand else 0
cand = [c for c in cand if abs(c[1] - vmed) * k < 6]
cand.sort(key=lambda c: -c[0])  # nut (largest u) first
pos = []
for c in cand:
    if pos and abs(pos[-1][-1] - c[0]) * k < 3.2:
        pos[-1].append(c[0]); continue
    pos.append([c[0]])
pos = [sum(g) / len(g) for g in pos]
def fit(ps):
    best = None
    for k0 in (0, 1):
        f = [1 - 2 ** (-(i + k0) / 12) for i in range(len(ps))]
        n = len(ps); mf = sum(f) / n; mp = sum(ps) / n
        sxx = sum((x - mf) ** 2 for x in f); sxy = sum((f[i] - mf) * (ps[i] - mp) for i in range(n))
        b = sxy / sxx; a = mp - b * mf
        res = math.sqrt(sum((ps[i] - a - b * f[i]) ** 2 for i in range(n)) / n)
        if best is None or res < best['res']: best = {'k0': k0, 'nut': a, 'b': b, 'res': res}
    return best
info = {'frets_found': len(pos)}
if len(pos) >= 8:
    F = fit(pos)
    # drop worst outliers iteratively
    while F['res'] * k > 0.3 and len(pos) > 8:
        f = [1 - 2 ** (-(i + F['k0']) / 12) for i in range(len(pos))]
        errs = [abs(pos[i] - F['nut'] - F['b'] * f[i]) for i in range(len(pos))]
        pos.pop(errs.index(max(errs))); F = fit(pos)
    info.update(scale_mm=round(-F['b'] * k, 2), fit_res_mm=round(F['res'] * k, 3), k0=F['k0'], nut_u=F['nut'], frets_used=len(pos))
    saddle_u = F['nut'] + F['b']
else:
    saddle_u = None
info['axis_v'] = vmed
json.dump({'info': info, 'saddle_u': saddle_u, 'axis_v': vmed, 'circles': circles, 'lines': lines, 'k': k}, open(outp, 'w'))
print(json.dumps(info))
