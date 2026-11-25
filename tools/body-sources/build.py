"""build.py contour.json analysis.json neck(right|left|up|down) out.json [--saddle-u U] [--axis-v V] [--neck-half 28] [--corner-deg 50] [--tol 0.35] [--flip]"""
import json, math, sys

a = sys.argv
C = json.load(open(a[1])); A = json.load(open(a[2])); neck = a[3]; outp = a[4]
opt = lambda n, d: (type(d)(a[a.index(n) + 1]) if n in a else d)
k = C['k']
saddle_u = opt('--saddle-u', A['saddle_u'] if A['saddle_u'] is not None else 0.0)
axis_v = opt('--axis-v', A['axis_v'])
NH = opt('--neck-half', 28.0)
CORNER = opt('--corner-deg', 50.0)
TOL = opt('--tol', 0.35)
flip = '--flip' in a
def uv(p):
    x, y = p
    return {'right': (x, y), 'left': (-x, -y), 'up': (-y, x), 'down': (y, -x)}[neck]
D = []
for p in C['pts']:
    u, v = uv(p)
    D.append(((v - axis_v) * k * (-1 if flip else 1), (u - saddle_u) * k))
# light smoothing of pixel stairs (keeps corners: window 2 samples each side)
def smooth(pts, w=2):
    n = len(pts); out = []
    for i in range(n):
        sx = sy = 0
        for j in range(-w, w + 1):
            sx += pts[(i + j) % n][0]; sy += pts[(i + j) % n][1]
        out.append((sx / (2 * w + 1), sy / (2 * w + 1)))
    return out
D = smooth(D)
# resample to ~0.5 mm spacing
def resample(pts, step=0.5):
    out = [pts[0]]; acc = 0
    n = len(pts)
    for i in range(1, n + 1):
        p, q = pts[i - 1], pts[i % n]
        d = math.dist(p, q)
        while acc + d >= step:
            t = (step - acc) / d
            p = (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
            out.append(p); d = math.dist(p, q); acc = 0
        acc += d
    return out
D = resample(D)
n = len(D)
# --smooth-at x,y,r[;x,y,r]  replace strap-button bumps with a smooth bridge
if '--smooth-at' in a:
    for spec in a[a.index('--smooth-at') + 1].split(';'):
        sx, sy, sr = map(float, spec.split(','))
        near = [i for i, p in enumerate(D) if math.dist(p, (sx, sy)) < sr]
        if not near: continue
        # contiguous run (circular)
        c = min(near, key=lambda i: math.dist(D[i], (sx, sy)))
        i0 = c
        while math.dist(D[(i0 - 1) % n], (sx, sy)) < sr: i0 = (i0 - 1) % n
        i1 = c
        while math.dist(D[(i1 + 1) % n], (sx, sy)) < sr: i1 = (i1 + 1) % n
        A0, A1 = D[i0], D[i1]
        t0 = (A0[0] - D[(i0 - 6) % n][0], A0[1] - D[(i0 - 6) % n][1]); t1 = (D[(i1 + 6) % n][0] - A1[0], D[(i1 + 6) % n][1] - A1[1])
        L = math.dist(A0, A1) / 3
        n0 = math.hypot(*t0) or 1; n1 = math.hypot(*t1) or 1
        c0 = (A0[0] + t0[0] / n0 * L, A0[1] + t0[1] / n0 * L); c1 = (A1[0] - t1[0] / n1 * L, A1[1] - t1[1] / n1 * L)
        cnt = (i1 - i0) % n
        for j in range(cnt + 1):
            t = j / cnt if cnt else 0
            u_ = 1 - t
            D[(i0 + j) % n] = (u_**3 * A0[0] + 3 * u_**2 * t * c0[0] + 3 * u_ * t**2 * c1[0] + t**3 * A1[0], u_**3 * A0[1] + 3 * u_**2 * t * c0[1] + 3 * u_ * t**2 * c1[1] + t**3 * A1[1])
ys = [p[1] for p in D]
ymax_body = opt('--ymax', 420.0)
# horn tips: highest point on each side away from the neck strip and below the headstock
def tip(side):
    best = None
    for i, (x, y) in enumerate(D):
        if side * x > NH + 6 and y < ymax_body and (best is None or y > D[best][1]): best = i
    return best
iB, iT = tip(-1), tip(1)
def walk(i0, side):
    # walk from the horn tip toward the neck until we reach the neck edge
    for direction in (1, -1):
        i = i0
        for steps in range(n):
            i = (i + direction) % n
            x, y = D[i]
            if side * x <= NH + 1.0:
                # the contour must continue up the neck edge from here (y increasing)
                j = (i + direction * 20) % n
                if D[j][1] > y + 3 and abs(D[j][0]) < NH + 4:
                    return i, direction
                break
            if y < D[i0][1] - 250: break
    return None, None
if '--no-neck' in a:
    # no neck drawn: pocket corners are where the top edge crosses x = -NH and x = +NH
    def crossing(xc):
        best = None
        for i in range(n):
            p, q = D[i], D[(i + 1) % n]
            if (p[0] - xc) * (q[0] - xc) <= 0 and p[0] != q[0] and p[1] < ymax_body:
                if best is None or p[1] > D[best][1]: best = i
        return best
    iL, iR = crossing(-NH), crossing(NH)
    # walk away from the short top edge
    fwd = (iR - iL) % n
    dL = 1 if fwd < n / 2 else -1
else:
    iL, dL = walk(iB, -1)
    iR, dR = walk(iT, 1)
info = {'bass_tip': [round(v, 1) for v in D[iB]], 'treble_tip': [round(v, 1) for v in D[iT]]}
if iL is None or iR is None:
    print('could not find pocket corners', info); sys.exit(1)
# body = from L going away from the neck (opposite of dL) around to R
seq = []
step = -dL
i = iL
while True:
    seq.append(D[i])
    if i == iR: break
    i = (i + step) % n
    if len(seq) > n: print('walk failed'); sys.exit(1)
# --- corner detection (sharp points like V wings)
def turn_at(s, i, span=4):
    a_ = s[max(0, i - span)]; b_ = s[i]; c_ = s[min(len(s) - 1, i + span)]
    h1 = math.atan2(b_[1] - a_[1], b_[0] - a_[0]); h2 = math.atan2(c_[1] - b_[1], c_[0] - b_[0])
    return abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi) * 180 / math.pi
corners = []
for i in range(6, len(seq) - 6):
    t = turn_at(seq, i)
    if t > CORNER and t >= max(turn_at(seq, j) for j in range(i - 4, i + 5)):
        if not corners or i - corners[-1] > 8: corners.append(i)
# --- Catmull-Rom (same as src/lib/geometry.ts sampleOutline)
def catmull(p0, p1, p2, p3, t, alpha=0.5):
    d = lambda a_, b_: max(1e-4, math.dist(a_, b_) ** alpha)
    t0 = 0; t1 = t0 + d(p0, p1); t2 = t1 + d(p1, p2); t3 = t2 + d(p2, p3)
    tt = t1 + (t2 - t1) * t
    lerp = lambda a_, b_, ta, tb: (a_[0] + (b_[0] - a_[0]) * (tt - ta) / (tb - ta), a_[1] + (b_[1] - a_[1]) * (tt - ta) / (tb - ta))
    a1 = lerp(p0, p1, t0, t1); a2 = lerp(p1, p2, t1, t2); a3 = lerp(p2, p3, t2, t3)
    b1 = lerp(a1, a2, t0, t2); b2 = lerp(a2, a3, t1, t3)
    return lerp(b1, b2, t1, t2)
def seg_samples(pts, i, step=0.5):
    m = len(pts); p1 = pts[i]; p2 = pts[(i + 1) % m]
    p0 = p1 if p1['c'] else pts[(i - 1) % m]; p3 = p2 if p2['c'] else pts[(i + 2) % m]
    L = math.dist((p1['x'], p1['y']), (p2['x'], p2['y'])); s = max(2, math.ceil(L / step))
    out = []
    for j in range(s + 1):
        t = j / s
        if p1['c'] and p2['c']: out.append((p1['x'] + (p2['x'] - p1['x']) * t, p1['y'] + (p2['y'] - p1['y']) * t))
        else: out.append(catmull((p0['x'], p0['y']), (p1['x'], p1['y']), (p2['x'], p2['y']), (p3['x'], p3['y']), t))
    return out
def dseg(p, a_, b_):
    dx, dy = b_[0] - a_[0], b_[1] - a_[1]; l2 = dx * dx + dy * dy
    t = 0 if l2 == 0 else max(0, min(1, ((p[0] - a_[0]) * dx + (p[1] - a_[1]) * dy) / l2))
    return math.hypot(p[0] - a_[0] - dx * t, p[1] - a_[1] - dy * t)
ctrl = sorted(set([0, len(seq) - 1] + corners))
# start with a point every ~30 mm
acc = 0
extra = []
for i in range(1, len(seq) - 1):
    acc += math.dist(seq[i], seq[i - 1])
    if acc >= 30: extra.append(i); acc = 0
ctrl = sorted(set(ctrl + extra))
cornerset = set([0, len(seq) - 1] + corners)
def build():
    return [{'x': round(seq[c][0], 1), 'y': round(seq[c][1], 1), 'c': c in cornerset, 'i': c} for c in ctrl]
for it in range(500):
    pts = build()
    worst = (0, None)
    for j in range(len(pts) - 1):
        S = seg_samples(pts, j)
        for i in range(pts[j]['i'], pts[j + 1]['i'] + 1):
            dd = min(dseg(seq[i], S[q], S[q + 1]) for q in range(len(S) - 1))
            if dd > worst[0]: worst = (dd, i)
    if worst[0] <= TOL: break
    ctrl = sorted(set(ctrl + [worst[1]]))
pts = build()
L, R = pts[0], pts[-1]
def fmt(p, pocket=None):
    if pocket: return f"P({p['x']:.1f}, {p['y']:.1f}, {{ corner: true, pocket: '{pocket}' }})"
    if p['c']: return f"P({p['x']:.1f}, {p['y']:.1f}, {{ corner: true }})"
    return f"[{p['x']:.1f}, {p['y']:.1f}]"
code = 'M(' + ', '.join([fmt(L, 'L')] + [fmt(p) for p in pts[1:-1]] + [fmt(R, 'R')]) + ')'
xs = [p[0] for p in seq]; ysq = [p[1] for p in seq]
info.update(points=len(pts), max_err=round(worst[0], 3), corners=len(corners), L=[L['x'], L['y']], R=[R['x'], R['y']],
            bounds=[round(min(xs), 1), round(max(xs), 1), round(min(ysq), 1), round(max(ysq), 1)])
# circles (holes) in body space
circ = []
for cx, cy, r in A.get('circles', []):
    x = (cy - axis_v) * k * (-1 if flip else 1); y = (cx - saddle_u) * k
    if min(xs) < x < max(xs) and min(ysq) < y < max(ysq): circ.append([round(x, 1), round(y, 1), round(r * k * 2, 1)])
json.dump({'info': info, 'code': code, 'dense': [[round(x, 2), round(y, 2)] for x, y in seq], 'circles': circ}, open(outp, 'w'))
print(json.dumps(info))
