def _catmull(p0, p1, p2, p3, t, alpha=0.5):
    d = lambda a_, b_: max(1e-4, math.dist(a_, b_) ** alpha)
    t0 = 0; t1 = t0 + d(p0, p1); t2 = t1 + d(p1, p2); t3 = t2 + d(p2, p3); tt = t1 + (t2 - t1) * t
    lerp = lambda a_, b_, ta, tb: (a_[0] + (b_[0] - a_[0]) * (tt - ta) / (tb - ta), a_[1] + (b_[1] - a_[1]) * (tt - ta) / (tb - ta))
    a1 = lerp(p0, p1, t0, t1); a2 = lerp(p1, p2, t1, t2); a3 = lerp(p2, p3, t2, t3); b1 = lerp(a1, a2, t0, t2); b2 = lerp(a2, a3, t1, t3)
    return lerp(b1, b2, t1, t2)
def _seg(pts, i, step=0.5):
    m = len(pts); p1 = pts[i]; p2 = pts[(i + 1) % m]
    p0 = p1 if p1['c'] else pts[(i - 1) % m]; p3 = p2 if p2['c'] else pts[(i + 2) % m]
    Ln = math.dist((p1['x'], p1['y']), (p2['x'], p2['y'])); s = max(2, math.ceil(Ln / step)); out = []
    for j in range(s + 1):
        t = j / s
        if p1['c'] and p2['c']: out.append((p1['x'] + (p2['x'] - p1['x']) * t, p1['y'] + (p2['y'] - p1['y']) * t))
        else: out.append(_catmull((p0['x'], p0['y']), (p1['x'], p1['y']), (p2['x'], p2['y']), (p3['x'], p3['y']), t))
    return out
def _dseg(p, a_, b_):
    ddx, ddy = b_[0] - a_[0], b_[1] - a_[1]; l2 = ddx * ddx + ddy * ddy
    t = 0 if l2 == 0 else max(0, min(1, ((p[0] - a_[0]) * ddx + (p[1] - a_[1]) * ddy) / l2))
    return math.hypot(p[0] - a_[0] - ddx * t, p[1] - a_[1] - ddy * t)
def fit(seq, corners, tol, start=30):
    cs = set([0, len(seq) - 1] + corners); ctrl = sorted(cs); acc = 0
    for i in range(1, len(seq) - 1):
        acc += math.dist(seq[i], seq[i - 1])
        if acc >= start: ctrl.append(i); acc = 0
    ctrl = sorted(set(ctrl))
    build = lambda: [{'x': round(seq[c][0], 1), 'y': round(seq[c][1], 1), 'c': c in cs, 'i': c} for c in ctrl]
    worst = (0, None)
    for it in range(500):
        pts = build(); worst = (0, None)
        for j in range(len(pts) - 1):
            S = _seg(pts, j)
            for i in range(pts[j]['i'], pts[j + 1]['i'] + 1):
                dd = min(_dseg(seq[i], S[q], S[q + 1]) for q in range(len(S) - 1))
                if dd > worst[0]: worst = (dd, i)
        if worst[0] <= tol: break
        ctrl = sorted(set(ctrl + [worst[1]]))
    return build(), worst[0]
