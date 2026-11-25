"""build_guard.py contour.json neck saddle_u axis_v out.json --shift dx,dy [--neck-half 28.5] [--notch-y Y] [--corner-deg 50]
Maps a traced pickguard into body space, cuts out the neck notch (|x| < neck half, y > notch-y) and fits points."""
import json, math, sys
a = sys.argv
C = json.load(open(a[1])); neck = a[2]; su = float(a[3]); av = float(a[4]); outp = a[5]
opt = lambda n, d: (type(d)(a[a.index(n) + 1]) if n in a else d)
k = C['k']; NH = opt('--neck-half', 28.5); NY = opt('--notch-y', 150.0); CORNER = opt('--corner-deg', 50.0); TOL = opt('--tol', 0.35)
dx, dy = [float(v) for v in opt('--shift', '0,0').split(',')]
def uv(p):
    x, y = p[0] + dx, p[1] + dy
    return {'right': (x, y), 'left': (-x, -y), 'up': (-y, x), 'down': (y, -x)}[neck]
D = [((uv(p)[1] - av) * k, (uv(p)[0] - su) * k) for p in C['pts']]
n0 = len(D)
D = [((D[(i - 1) % n0][0] + D[i][0] + D[(i + 1) % n0][0]) / 3, (D[(i - 1) % n0][1] + D[i][1] + D[(i + 1) % n0][1]) / 3) for i in range(n0)]
out = [D[0]]; acc = 0
for i in range(1, len(D) + 1):
    p, q = D[i - 1], D[i % len(D)]; d = math.dist(p, q)
    while acc + d >= 0.5:
        t = (0.5 - acc) / d; p = (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t); out.append(p); d = math.dist(p, q); acc = 0
    acc += d
D = out; n = len(D)
# notch = points inside the neck strip above NY; pocket corners = last points before entering it
inn = [abs(p[0]) < NH and p[1] > NY for p in D]
# find a run of notch points; the contour enters on one side and leaves on the other
start = next(i for i in range(n) if inn[i] and not inn[i - 1])
end = start
while inn[(end + 1) % n]: end = (end + 1) % n
A_, B_ = D[(start - 1) % n], D[(end + 1) % n]
L, R = (A_, B_) if A_[0] < B_[0] else (B_, A_)
# walk the long way from L to R (the side outside the notch)
iL = (start - 1) % n if A_[0] < B_[0] else (end + 1) % n
iR = (end + 1) % n if A_[0] < B_[0] else (start - 1) % n
step = -1 if A_[0] < B_[0] else 1
seq = []; i = iL
while True:
    seq.append(D[i])
    if i == iR: break
    i = (i + step) % n
def turn_at(s, i, span=4):
    a_ = s[max(0, i - span)]; b_ = s[i]; c_ = s[min(len(s) - 1, i + span)]
    h1 = math.atan2(b_[1] - a_[1], b_[0] - a_[0]); h2 = math.atan2(c_[1] - b_[1], c_[0] - b_[0])
    return abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi) * 180 / math.pi
corners = []
for i in range(6, len(seq) - 6):
    t = turn_at(seq, i)
    if t > CORNER and t >= max(turn_at(seq, j) for j in range(i - 4, i + 5)):
        if not corners or i - corners[-1] > 8: corners.append(i)
exec(open(__file__.replace('build_guard.py', 'fitlib.py')).read())
pts, err = fit(seq, corners, TOL)
def fmt(p, pocket=None):
    if pocket: return f"P({p['x']:.1f}, {p['y']:.1f}, {{ corner: true, pocket: '{pocket}' }})"
    if p['c']: return f"P({p['x']:.1f}, {p['y']:.1f}, {{ corner: true }})"
    return f"[{p['x']:.1f}, {p['y']:.1f}]"
code = 'M(' + ', '.join([fmt(pts[0], 'L')] + [fmt(p) for p in pts[1:-1]] + [fmt(pts[-1], 'R')]) + ')'
xs = [p[0] for p in seq]; ys = [p[1] for p in seq]
info = {'points': len(pts), 'max_err': round(err, 3), 'corners': len(corners), 'L': [pts[0]['x'], pts[0]['y']], 'R': [pts[-1]['x'], pts[-1]['y']], 'bounds': [round(min(xs), 1), round(max(xs), 1), round(min(ys), 1), round(max(ys), 1)]}
json.dump({'info': info, 'code': code, 'dense': [[round(x, 2), round(y, 2)] for x, y in seq], 'circles': []}, open(outp, 'w'))
print(json.dumps(info))
