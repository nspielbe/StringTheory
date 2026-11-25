"""run.py svg crop(x,y,w,h svg units) out.json [pxmm] [close] [open] [debug.png|-] [post] [thr] [frets-json|-] [holes-json|-] [seed-json]
Rasterises the SVG in headless Chrome, fills the silhouette and returns its contour (svg units)."""
import sys, json, subprocess, re, os, base64, html, tempfile
svgp, crop, outp = sys.argv[1], [float(v) for v in sys.argv[2].split(',')], sys.argv[3]
pxmm = float(sys.argv[4]) if len(sys.argv) > 4 else 8
close = int(sys.argv[5]) if len(sys.argv) > 5 else 1
opn = int(sys.argv[6]) if len(sys.argv) > 6 else 3
dbg = sys.argv[7] if len(sys.argv) > 7 and sys.argv[7] != '-' else None
post = int(sys.argv[8]) if len(sys.argv) > 8 else 0
thr = int(sys.argv[9]) if len(sys.argv) > 9 else 600
fr = json.loads(sys.argv[10]) if len(sys.argv) > 10 and sys.argv[10] != '-' else None
ho = json.loads(sys.argv[11]) if len(sys.argv) > 11 and sys.argv[11] != '-' else None
seed = json.loads(sys.argv[12]) if len(sys.argv) > 12 else None
svg = open(svgp).read()
vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
wmm = float(re.search(r'width="([\d.]+)mm"', svg).group(1))
k = wmm / vb[2]
here = os.path.dirname(os.path.abspath(__file__))
job = {'svg': svg, 'k': k, 'crop': crop, 'pxmm': pxmm, 'close': close, 'open': opn, 'post': post, 'thr': thr, 'frets': fr, 'holes': ho, 'seed': seed, 'debug': bool(dbg)}
tmp = tempfile.mkdtemp(prefix='body-sources-')
page = os.path.join(tmp, 'job.html')
open(page, 'w').write('<!doctype html><meta charset="utf-8"><pre id="out">pending</pre><script>window.JOB=' + json.dumps(job) + '</script><script src="file://' + os.path.join(here, 'tracer.js') + '"></script>')
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
r = subprocess.run([CH, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', f'--user-data-dir={tmp}/profile', '--virtual-time-budget=60000', '--dump-dom', 'file://' + page], capture_output=True, text=True, timeout=300)
m = re.search(r'<pre id="out">(.*?)</pre>', r.stdout, re.S)
data = json.loads(html.unescape(m.group(1)))
if not data.get('ok'):
    print('ERROR', data.get('err')); sys.exit(1)
if dbg and data.get('png'):
    open(dbg, 'wb').write(base64.b64decode(data['png'].split(',')[1]))
data.pop('png', None)
data['k'] = k
data['crop'] = crop
json.dump(data, open(outp, 'w'))
print(f"raster {data['W']}x{data['H']}, contour {len(data['pts'])} pts, area {data['area']}")
