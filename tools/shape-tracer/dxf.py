"""Minimal DXF reader: returns a list of polylines (lists of (x,y)) per entity."""
import math

def pairs_of(text):
    L = text.splitlines()
    return [(L[i].strip(), L[i+1].strip()) for i in range(0, len(L) - 1, 2)]

def bulge_arc(p, q, b, n=12):
    if abs(b) < 1e-9: return [q]
    th = 4 * math.atan(b)
    dx, dy = q[0]-p[0], q[1]-p[1]
    c = math.hypot(dx, dy)
    if c < 1e-12: return [q]
    r = c / (2 * math.sin(th/2))
    mx, my = (p[0]+q[0])/2, (p[1]+q[1])/2
    h = r * math.cos(th/2)
    nx, ny = -dy/c, dx/c
    cx, cy = mx + nx*h, my + ny*h
    a0 = math.atan2(p[1]-cy, p[0]-cx)
    out=[]
    for k in range(1, n+1):
        a = a0 + th*k/n
        out.append((cx + abs(r)*math.cos(a) * (1 if r>0 else 1), cy + abs(r)*math.sin(a)))
    # correct sign issues by snapping last point
    out[-1] = q
    return out

def deboor(k, t, ctrl, x):
    n = len(ctrl)
    # find span
    s = k
    while s < n-1 and not (t[s] <= x < t[s+1]): s += 1
    d = [list(ctrl[j + s - k]) for j in range(k+1)]
    for r in range(1, k+1):
        for j in range(k, r-1, -1):
            den = t[j+1+s-r] - t[j+s-k]
            a = 0 if den == 0 else (x - t[j+s-k]) / den
            d[j] = [(1-a)*d[j-1][0] + a*d[j][0], (1-a)*d[j-1][1] + a*d[j][1]]
    return tuple(d[k])

def entities(text):
    P = pairs_of(text)
    i = 0
    while i < len(P) and not (P[i] == ('2', 'ENTITIES')): i += 1
    ents = []
    cur = None
    def flush():
        if cur: ents.append(cur)
    while i < len(P):
        g, v = P[i]
        if g == '0':
            flush()
            cur = {'type': v, 'data': []} if v in ('LWPOLYLINE','LINE','ARC','CIRCLE','SPLINE','POLYLINE','VERTEX','ELLIPSE') else None
            if v == 'ENDSEC': break
        elif cur is not None:
            cur['data'].append((g, v))
        i += 1
    flush()
    out = []
    poly = None
    for e in ents:
        d = e['data']; t = e['type']
        get = lambda code, default=None: next((float(v) for g, v in d if g == code), default)
        layer = next((v for g, v in d if g == '8'), '')
        if t == 'LINE':
            out.append({'layer': layer, 'type': t, 'pts': [(get('10'), get('20')), (get('11'), get('21'))]})
        elif t in ('ARC', 'CIRCLE'):
            cx, cy, r = get('10'), get('20'), get('40')
            a0 = math.radians(get('50', 0.0)); a1 = math.radians(get('51', 360.0))
            if t == 'CIRCLE': a0, a1 = 0, 2*math.pi
            if a1 <= a0: a1 += 2*math.pi
            n = max(8, int((a1-a0)*r/2))
            out.append({'layer': layer, 'type': t, 'pts': [(cx + r*math.cos(a0+(a1-a0)*k/n), cy + r*math.sin(a0+(a1-a0)*k/n)) for k in range(n+1)]})
        elif t == 'LWPOLYLINE':
            closed = int(get('70', 0)) & 1
            verts = []
            for g, v in d:
                if g == '10': verts.append([float(v), None, 0.0])
                elif g == '20': verts[-1][1] = float(v)
                elif g == '42': verts[-1][2] = float(v)
            pts = [(verts[0][0], verts[0][1])] if verts else []
            seq = verts + ([verts[0]] if closed and verts else [])
            for a, b in zip(seq, seq[1:]):
                pts += bulge_arc((a[0], a[1]), (b[0], b[1]), a[2])
            out.append({'layer': layer, 'type': t, 'pts': pts, 'closed': bool(closed)})
        elif t == 'SPLINE':
            k = int(get('71', 3))
            knots = [float(v) for g, v in d if g == '40']
            cx = [float(v) for g, v in d if g == '10']; cy = [float(v) for g, v in d if g == '20']
            fx = [float(v) for g, v in d if g == '11']; fy = [float(v) for g, v in d if g == '21']
            ctrl = list(zip(cx, cy))
            if ctrl and knots and len(knots) == len(ctrl) + k + 1:
                lo, hi = knots[k], knots[len(ctrl)]
                N = max(40, len(ctrl) * 12)
                pts = [deboor(k, knots, ctrl, lo + (hi-lo)*j/N * 0.999999) for j in range(N+1)]
            else:
                pts = list(zip(fx, fy)) or ctrl
            out.append({'layer': layer, 'type': t, 'pts': pts})
        elif t == 'POLYLINE':
            poly = {'layer': layer, 'type': t, 'pts': [], 'closed': bool(int(get('70', 0)) & 1)}
            out.append(poly)
        elif t == 'VERTEX' and poly is not None:
            poly['pts'].append((get('10'), get('20')))
    return out
