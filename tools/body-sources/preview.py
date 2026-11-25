"""preview.py body.json out.svg : dense trace (grey) + fitted spline (orange) + control points"""
import json, math, re, sys
B = json.load(open(sys.argv[1]))
code = B['code']
toks = re.findall(r"P\(([-\d.]+), ([-\d.]+), \{ corner: true(?:, pocket: '(\w)')? \}\)|\[([-\d.]+), ([-\d.]+)\]", code)
pts = []
for t in toks:
    if t[0]: pts.append({'x': float(t[0]), 'y': float(t[1]), 'c': True, 'pocket': t[2]})
    else: pts.append({'x': float(t[3]), 'y': float(t[4]), 'c': False})
def catmull(p0, p1, p2, p3, t, alpha=0.5):
    d = lambda a, b: max(1e-4, math.dist(a, b) ** alpha)
    t0 = 0; t1 = t0 + d(p0, p1); t2 = t1 + d(p1, p2); t3 = t2 + d(p2, p3); tt = t1 + (t2 - t1) * t
    L = lambda a, b, ta, tb: (a[0] + (b[0] - a[0]) * (tt - ta) / (tb - ta), a[1] + (b[1] - a[1]) * (tt - ta) / (tb - ta))
    a1 = L(p0, p1, t0, t1); a2 = L(p1, p2, t1, t2); a3 = L(p2, p3, t2, t3); b1 = L(a1, a2, t0, t2); b2 = L(a2, a3, t1, t3)
    return L(b1, b2, t1, t2)
m = len(pts); S = []
for i in range(m):
    p1, p2 = pts[i], pts[(i + 1) % m]
    p0 = p1 if p1['c'] else pts[(i - 1) % m]; p3 = p2 if p2['c'] else pts[(i + 2) % m]
    for j in range(20):
        t = j / 20
        if p1['c'] and p2['c']: S.append((p1['x'] + (p2['x'] - p1['x']) * t, p1['y'] + (p2['y'] - p1['y']) * t))
        else: S.append(catmull((p0['x'], p0['y']), (p1['x'], p1['y']), (p2['x'], p2['y']), (p3['x'], p3['y']), t))
xs = [p[0] for p in B['dense']]; ys = [p[1] for p in B['dense']]
x0, x1, y0, y1 = min(xs) - 15, max(xs) + 15, min(ys) - 15, max(ys) + 15
path = lambda P: 'M' + ' L'.join(f'{x:.2f},{-y:.2f}' for x, y in P)
dots = ''.join(f'<rect x="{p["x"]-2}" y="{-p["y"]-2}" width="4" height="4" fill="{"#0a0" if p.get("pocket") else ("#c00" if p["c"] else "#06f")}"/>' for p in pts)
circ = ''.join(f'<circle cx="{c[0]}" cy="{-c[1]}" r="{c[2]/2}" fill="none" stroke="#888" stroke-width="0.6"/>' for c in B.get('circles', []))
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {-y1} {x1-x0} {y1-y0}" width="800" height="{800*(y1-y0)/(x1-x0):.0f}" style="background:#fff"><line x1="{x0}" x2="{x1}" y1="0" y2="0" stroke="#09c" stroke-width="0.6"/><line x1="0" x2="0" y1="{-y1}" y2="{-y0}" stroke="#09c" stroke-width="0.4"/><path d="{path(B["dense"])}Z" fill="#eee" stroke="#999" stroke-width="2.4"/><path d="{path(S)}Z" fill="none" stroke="#e67e00" stroke-width="0.8"/>{circ}{dots}</svg>'
open(sys.argv[2], 'w').write(svg)
