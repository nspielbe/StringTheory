"""build_head.py contour.json neck nut_u axis_v out.json [--svg cad.svg] [--holes holes.json] [--corner-deg 45] [--tol 0.3] [--nut-half 21.4]
Headstock space: y = 0 at the nut (fretboard face), +y away from the body, bass side at -x."""
import json, math, re, sys
a = sys.argv
C = json.load(open(a[1])); neck = a[2]; nut_u = float(a[3]); axis_v = float(a[4]); outp = a[5]
opt = lambda n, d: (type(d)(a[a.index(n) + 1]) if n in a else d)
k = C['k']; CORNER = opt('--corner-deg', 45.0); TOL = opt('--tol', 0.3); NUTH = opt('--nut-half', 21.4)
def uv(p):
    x, y = p
    return {'right': (x, y), 'left': (-x, -y), 'up': (-y, x), 'down': (y, -x)}[neck]
FL = -1 if '--flip' in a else 1
D = [(FL * (uv(p)[1] - axis_v) * k, (uv(p)[0] - nut_u) * k) for p in C['pts']]
if FL < 0: D.reverse()
def smooth(pts, w=1):
    n = len(pts); return [(sum(pts[(i + j) % n][0] for j in range(-w, w + 1)) / (2 * w + 1), sum(pts[(i + j) % n][1] for j in range(-w, w + 1)) / (2 * w + 1)) for i in range(n)]
def resample(pts, step=0.4):
    out = [pts[0]]; acc = 0; n = len(pts)
    for i in range(1, n + 1):
        p, q = pts[i - 1], pts[i % n]; d = math.dist(p, q)
        while acc + d >= step:
            t = (step - acc) / d; p = (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t); out.append(p); d = math.dist(p, q); acc = 0
        acc += d
    return out
D = resample(smooth(D)); n = len(D)
if '--smooth-range' in a:
    y0, y1, side, w = opt('--smooth-range', '').split(',')
    y0, y1, side, w = float(y0), float(y1), float(side), int(w)
    idx = [i for i, p in enumerate(D) if y0 <= p[1] <= y1 and side * p[0] > 0]
    src = list(D)
    for i in idx:
        xs = [src[(i + j) % n] for j in range(-w, w + 1)]
        D[i] = (sum(p[0] for p in xs) / len(xs), sum(p[1] for p in xs) / len(xs))
# crossings of y = 0 near the neck edges
cr = []
for i in range(n):
    p, q = D[i], D[(i + 1) % n]
    if (p[1] - 0) * (q[1] - 0) <= 0 and p[1] != q[1]:
        x = p[0] + (q[0] - p[0]) * (0 - p[1]) / (q[1] - p[1])
        if abs(x) < 40: cr.append((x, i))
L = min(cr, key=lambda c: c[0]); R = max(cr, key=lambda c: c[0])
# go from L into y > 0
iL, iR = L[1], R[1]
step = 1 if D[(iL + 3) % n][1] > 0 else -1
seq = [(L[0], 0.0)]
i = iL
while True:
    i = (i + step) % n
    if i == (iR + (1 if step == 1 else 0)) % n or len(seq) > n: break
    seq.append(D[i])
seq.append((R[0], 0.0))
def turn_at(s, i, span=4):
    a_ = s[max(0, i - span)]; b_ = s[i]; c_ = s[min(len(s) - 1, i + span)]
    h1 = math.atan2(b_[1] - a_[1], b_[0] - a_[0]); h2 = math.atan2(c_[1] - b_[1], c_[0] - b_[0])
    return abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi) * 180 / math.pi
corners = []
for i in range(6, len(seq) - 6):
    t = turn_at(seq, i)
    if t > CORNER and t >= max(turn_at(seq, j) for j in range(i - 4, i + 5)):
        if not corners or i - corners[-1] > 8: corners.append(i)
def catmull(p0, p1, p2, p3, t, alpha=0.5):
    d = lambda a_, b_: max(1e-4, math.dist(a_, b_) ** alpha)
    t0 = 0; t1 = t0 + d(p0, p1); t2 = t1 + d(p1, p2); t3 = t2 + d(p2, p3); tt = t1 + (t2 - t1) * t
    lerp = lambda a_, b_, ta, tb: (a_[0] + (b_[0] - a_[0]) * (tt - ta) / (tb - ta), a_[1] + (b_[1] - a_[1]) * (tt - ta) / (tb - ta))
    a1 = lerp(p0, p1, t0, t1); a2 = lerp(p1, p2, t1, t2); a3 = lerp(p2, p3, t2, t3); b1 = lerp(a1, a2, t0, t2); b2 = lerp(a2, a3, t1, t3)
    return lerp(b1, b2, t1, t2)
def seg_samples(pts, i, step=0.4):
    m = len(pts); p1 = pts[i]; p2 = pts[(i + 1) % m]
    p0 = p1 if p1['c'] else pts[(i - 1) % m]; p3 = p2 if p2['c'] else pts[(i + 2) % m]
    Ln = math.dist((p1['x'], p1['y']), (p2['x'], p2['y'])); s = max(2, math.ceil(Ln / step)); out = []
    for j in range(s + 1):
        t = j / s
        if p1['c'] and p2['c']: out.append((p1['x'] + (p2['x'] - p1['x']) * t, p1['y'] + (p2['y'] - p1['y']) * t))
        else: out.append(catmull((p0['x'], p0['y']), (p1['x'], p1['y']), (p2['x'], p2['y']), (p3['x'], p3['y']), t))
    return out
def dseg(p, a_, b_):
    dx, dy = b_[0] - a_[0], b_[1] - a_[1]; l2 = dx * dx + dy * dy
    t = 0 if l2 == 0 else max(0, min(1, ((p[0] - a_[0]) * dx + (p[1] - a_[1]) * dy) / l2))
    return math.hypot(p[0] - a_[0] - dx * t, p[1] - a_[1] - dy * t)
cornerset = set([0, len(seq) - 1] + corners)
ctrl = sorted(cornerset); acc = 0
for i in range(1, len(seq) - 1):
    acc += math.dist(seq[i], seq[i - 1])
    if acc >= 20: ctrl.append(i); acc = 0
ctrl = sorted(set(ctrl))
build = lambda: [{'x': round(seq[c][0], 1), 'y': round(seq[c][1], 1), 'c': c in cornerset, 'i': c} for c in ctrl]
for it in range(400):
    pts = build(); worst = (0, None)
    for j in range(len(pts) - 1):
        S = seg_samples(pts, j)
        for i in range(pts[j]['i'], pts[j + 1]['i'] + 1):
            dd = min(dseg(seq[i], S[q], S[q + 1]) for q in range(len(S) - 1))
            if dd > worst[0]: worst = (dd, i)
    if worst[0] <= TOL: break
    ctrl = sorted(set(ctrl + [worst[1]]))
pts = build()
pts[0]['y'] = 0.0; pts[-1]['y'] = 0.0
def fmt(p, pocket=None):
    if pocket: return f"P({p['x']:.1f}, 0, {{ corner: true, pocket: '{pocket}' }})"
    if p['c']: return f"P({p['x']:.1f}, {p['y']:.1f}, {{ corner: true }})"
    return f"[{p['x']:.1f}, {p['y']:.1f}]"
code = 'M(' + ', '.join([fmt(pts[0], 'L')] + [fmt(p) for p in pts[1:-1]] + [fmt(pts[-1], 'R')]) + ')'
# tuner holes from CAD circles (6-12 mm) inside the headstock
holes = []
if '--svg' in a:
    svg = open(opt('--svg', '')).read(); crop = C.get('crop')
    for d, t in re.findall(r'<path d="([^"]+)" data-type="(\w+)"/>', svg):
        q = [tuple(map(float, s[1:].split(','))) for s in d.split(' ')]
        if t not in ('CIRCLE', 'ARC', 'POLYLINE', 'LWPOLYLINE') or len(q) < 8 or math.dist(q[0], q[-1]) > 1e-3 * max(1, 1 / k): continue
        if crop and not all(crop[0] <= x <= crop[0] + crop[2] and crop[1] <= y <= crop[1] + crop[3] for x, y in q): continue
        cx = sum(p[0] for p in q) / len(q); cy = sum(p[1] for p in q) / len(q)
        r = sum(math.dist(p, (cx, cy)) for p in q) / len(q) * k
        if max(math.dist(p, (cx, cy)) * k for p in q) - r > 0.5: continue  # not round
        u, v = uv((cx, cy)); hx, hy = FL * (v - axis_v) * k, (u - nut_u) * k
        if hy > 15 and 3 <= r <= 7: holes.append((round(hx, 2), round(hy, 2), round(2 * r, 2)))
if '--holes' in a:
    for hx, hy, dd in json.load(open(opt('--holes', ''))): holes.append((hx, hy, dd))
# keep the largest diameter per location
uniq = []
for h in sorted(holes, key=lambda h: -h[2]):
    if all(math.dist(h[:2], u_[:2]) > 4 for u_ in uniq): uniq.append(h)
xs = [p[0] for p in seq]; ys = [p[1] for p in seq]
info = {'points': len(pts), 'max_err': round(worst[0], 3), 'corners': len(corners), 'nut': [round(L[0], 2), round(R[0], 2)], 'bounds': [round(min(xs), 1), round(max(xs), 1), round(min(ys), 1), round(max(ys), 1)], 'holes': sorted(uniq, key=lambda h: (h[0] > 0, h[1]))}
json.dump({'info': info, 'code': code, 'dense': [[round(x, 2), round(y, 2)] for x, y in seq]}, open(outp, 'w'))
print(json.dumps(info))
