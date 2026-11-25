"""rotwrap.py plan.svg mmPerUnit rotDeg out.svg -> mm-unit SVG of the whole sheet rotated about its centre"""
import sys, re, base64, math
src, k, rot, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
t = open(src).read()
vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', t).group(1).split()]
W, H = vb[2] * k, vb[3] * k
c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
R = math.hypot(W, H)
b64 = base64.b64encode(t.encode()).decode()
open(out, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-R/2:.3f} {-R/2:.3f} {R:.3f} {R:.3f}" width="{R:.3f}mm" height="{R:.3f}mm"><g transform="rotate({rot})"><image href="data:image/svg+xml;base64,{b64}" x="{-W/2:.3f}" y="{-H/2:.3f}" width="{W:.3f}" height="{H:.3f}"/></g></svg>')
print(out, f'{R:.1f} mm square; original sheet centred at 0,0')
