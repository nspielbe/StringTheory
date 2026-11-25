// Paste into the browser console on the dev server (npm run dev) to measure plans.
// measurePlans(['s-style/s-body-full.svg', ...]) returns each drawing's extent in SVG user
// units ([x, y, w, h]) for the `box` field in src/data/plans.ts. Hidden layers are ignored.
async function measurePlans(files) {
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:500px;height:500px;overflow:hidden'
  document.body.appendChild(host)
  const out = {}
  for (const f of files) {
    const txt = await fetch('/plans/' + f).then((r) => r.text())
    const svg = document.importNode(new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement, true)
    host.appendChild(svg)
    const b = svg.getBBox()
    out[f] = [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 100) / 100)
    host.removeChild(svg)
  }
  host.remove()
  return out
}
