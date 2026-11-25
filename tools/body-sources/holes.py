"""holes.py trace.json dmin dmax -> round holes (cx, cy, d) in svg units, merging crosshair quarters"""
import json, sys, math
d = json.load(open(sys.argv[1])); dmin, dmax = float(sys.argv[2]), float(sys.argv[3])
comps = [c for c in d['holes'] if max(c[2] - c[0], c[3] - c[1]) <= dmax * 1.05]
used = [False] * len(comps); out = []
for i, c in enumerate(comps):
    if used[i]: continue
    group = [i]; used[i] = True
    changed = True
    while changed:
        changed = False
        bx0 = min(comps[g][0] for g in group); by0 = min(comps[g][1] for g in group); bx1 = max(comps[g][2] for g in group); by1 = max(comps[g][3] for g in group)
        for j, e in enumerate(comps):
            if used[j]: continue
            if e[0] < bx1 + 0.8 and e[2] > bx0 - 0.8 and e[1] < by1 + 0.8 and e[3] > by0 - 0.8 and max(bx1, e[2]) - min(bx0, e[0]) <= dmax * 1.05 and max(by1, e[3]) - min(by0, e[1]) <= dmax * 1.05:
                group.append(j); used[j] = True; changed = True
    bx0 = min(comps[g][0] for g in group); by0 = min(comps[g][1] for g in group); bx1 = max(comps[g][2] for g in group); by1 = max(comps[g][3] for g in group)
    w, h = bx1 - bx0, by1 - by0; area = sum(comps[g][4] for g in group)
    if dmin <= w <= dmax and abs(w - h) <= max(0.6, 0.12 * w) and area > 0.6 * math.pi * (w / 2) ** 2:
        out.append([round((bx0 + bx1) / 2, 3), round((by0 + by1) / 2, 3), round((w + h) / 2, 2)])
print(json.dumps(out))
