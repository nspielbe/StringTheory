"""Helpers for the plan library (public/plans + src/data/plans.ts).

  python3 tools/plans/plans.py info public/plans/<style>/<id>.svg
      prints mmPerUnit, bytes and sheet size for the manifest entry
  python3 tools/plans/plans.py thumbs [id ...]
      renders public/plans/thumbs/<id>.png (800x560) for the given plans, or all of them,
      cropped to each plan's `box`. Uses headless Google Chrome.
"""
import os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLANS = os.path.join(ROOT, 'public', 'plans')
MANIFEST = os.path.join(ROOT, 'src', 'data', 'plans.ts')
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
UNIT_MM = {'in': 25.4, 'mm': 1.0, 'cm': 10.0, 'pt': 25.4 / 72, 'px': 25.4 / 96, '': 25.4 / 96}
ROOT_TAG = re.compile(r'<svg\b[^>]*>', re.S)


def length_mm(v):
    m = re.fullmatch(r'\s*([0-9.]+)\s*([a-z]*)\s*', v)
    return float(m.group(1)) * UNIT_MM[m.group(2)]


def info(path):
    data = open(path, 'rb').read()
    tag = ROOT_TAG.search(data[:8000].decode('utf-8', 'ignore')).group(0)
    attr = lambda n: re.search(r'\s' + n + r'="([^"]*)"', tag).group(1)
    vb = [float(x) for x in re.split(r'[\s,]+', attr('viewBox').strip())]
    w, h = length_mm(attr('width')), length_mm(attr('height'))
    print(f'mmPerUnit: {w / vb[2]:.6g}, bytes: {len(data)}  (sheet {w:.1f} x {h:.1f} mm, viewBox {vb})')


def manifest():
    rows = re.findall(r"\{id: '([^']+)'.*?file: '([^']+)'.*?box: \[([^\]]+)\]", open(MANIFEST, encoding='utf-8').read())
    return [(pid, f, [float(v) for v in box.split(',')]) for pid, f, box in rows]


def thumbs(ids):
    out_dir = os.path.join(PLANS, 'thumbs')
    os.makedirs(out_dir, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for pid, f, (x, y, w, h) in manifest():
            if ids and pid not in ids:
                continue
            p = max(w, h) * 0.04
            txt = open(os.path.join(PLANS, f), encoding='utf-8').read()
            m = ROOT_TAG.search(txt)
            tag = re.sub(r'\s(viewBox|width|height|preserveAspectRatio)="[^"]*"', '', m.group(0)).rstrip('>').rstrip('/')
            tag += f' viewBox="{x - p:.3f} {y - p:.3f} {w + 2 * p:.3f} {h + 2 * p:.3f}" width="800" height="560" preserveAspectRatio="xMidYMid meet" style="background:#fff">'
            src = os.path.join(tmp, pid + '.svg')
            open(src, 'w', encoding='utf-8').write(txt[:m.start()] + tag + txt[m.end():])
            png = os.path.join(out_dir, pid + '.png')
            subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
                            f'--user-data-dir={os.path.join(tmp, "profile")}', '--window-size=800,560', '--virtual-time-budget=10000',
                            f'--screenshot={png}', 'file://' + src], check=True, capture_output=True)
            print('wrote', os.path.relpath(png, ROOT))


if __name__ == '__main__':
    cmd, args = sys.argv[1], sys.argv[2:]
    info(args[0]) if cmd == 'info' else thumbs(set(args))
