import sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dxf import entities
src, out = sys.argv[1], sys.argv[2]
ents = entities(open(src, errors='ignore').read())
print('layers', collections.Counter(e['layer'] for e in ents).most_common(20))
allp = [p for e in ents for p in e['pts'] if p[0] is not None]
xs=[p[0] for p in allp]; ys=[p[1] for p in allp]
minx,maxx,miny,maxy=min(xs),max(xs),min(ys),max(ys)
paths=[]
for e in ents:
    pts=[p for p in e['pts'] if p[0] is not None]
    if len(pts)<2: continue
    d=' '.join(('M' if i==0 else 'L')+f'{x-minx:.2f},{maxy-y:.2f}' for i,(x,y) in enumerate(pts))
    paths.append(f'<path d="{d}" data-layer="{e["layer"]}" data-type="{e["type"]}"/>')
w,h=maxx-minx,maxy-miny
open(out,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.2f}mm" height="{h:.2f}mm"><g fill="none" stroke="#000" stroke-width="0.4">{"".join(paths)}</g></svg>')
print(out, f'{w:.1f} x {h:.1f}', len(paths), 'paths')
