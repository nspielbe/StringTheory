// Silhouette tracer for guitar reference images (runs in the browser).
// Steps: render -> mask -> fill holes -> largest blob -> (remove neck) -> outer contour.

async function load(src, targetH, rotate = 0) {
  const img = new Image()
  // fetch as a same-origin blob so drawing never taints the canvas
  let blob = await fetch(src).then((r) => r.blob())
  if (blob.type.includes('svg') || src.endsWith('.svg')) {
    // drop embedded/linked bitmaps, they taint the canvas
    const txt = (await blob.text()).replace(/<image[\s\S]*?(\/>|<\/image>)/g, '')
    blob = new Blob([txt], { type: 'image/svg+xml' })
  }
  img.src = URL.createObjectURL(blob)
  await img.decode()
  let w = img.naturalWidth || 1000, h = img.naturalHeight || 1000
  const rot = rotate % 180 !== 0
  const s = targetH / (rot ? w : h)
  const c = document.createElement('canvas')
  c.width = Math.round((rot ? h : w) * s)
  c.height = Math.round((rot ? w : h) * s)
  const g = c.getContext('2d', { willReadFrequently: true })
  g.save()
  g.translate(c.width / 2, c.height / 2)
  g.rotate((rotate * Math.PI) / 180)
  g.drawImage(img, (-w * s) / 2, (-h * s) / 2, w * s, h * s)
  g.restore()
  return c
}

function toMask(c, mode, tol = 60) {
  const W = c.width, H = c.height
  const d = c.getContext('2d').getImageData(0, 0, W, H).data
  const m = new Uint8Array(W * H)
  if (mode === 'alpha') {
    for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] > 110 ? 1 : 0
  } else if (mode === 'dark') {
    for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] > 40 && d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] < 600 ? 1 : 0
  } else {
    // background colour from the border
    const samples = []
    for (let x = 0; x < W; x += 4) { samples.push(x); samples.push((H - 1) * W + x) }
    for (let y = 0; y < H; y += 4) { samples.push(y * W); samples.push(y * W + W - 1) }
    const med = [0, 1, 2].map((k) => samples.map((i) => d[i * 4 + k]).sort((a, b) => a - b)[samples.length >> 1])
    for (let i = 0; i < W * H; i++) {
      const dr = d[i * 4] - med[0], dg = d[i * 4 + 1] - med[1], db = d[i * 4 + 2] - med[2]
      m[i] = Math.sqrt(dr * dr + dg * dg + db * db) > tol ? 1 : 0
    }
  }
  return m
}

/** Everything not reachable from the border through empty pixels becomes solid. */
function fillHoles(m, W, H) {
  const out = new Uint8Array(W * H).fill(1)
  const q = new Int32Array(W * H)
  let qh = 0, qt = 0
  const push = (i) => { if (!m[i] && out[i]) { out[i] = 0; q[qt++] = i } }
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x) }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1) }
  while (qh < qt) {
    const i = q[qh++], x = i % W
    if (x > 0) push(i - 1)
    if (x < W - 1) push(i + 1)
    if (i >= W) push(i - W)
    if (i < W * (H - 1)) push(i + W)
  }
  return out
}

function largest(m, W, H) {
  const lab = new Int32Array(W * H)
  const q = new Int32Array(W * H)
  let best = 0, bestSize = 0, n = 0
  for (let s = 0; s < W * H; s++) {
    if (!m[s] || lab[s]) continue
    n++
    let qh = 0, qt = 0
    q[qt++] = s
    lab[s] = n
    while (qh < qt) {
      const i = q[qh++], x = i % W
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]
      for (const j of nb) if (j >= 0 && j < W * H && m[j] && !lab[j]) { lab[j] = n; q[qt++] = j }
    }
    if (qt > bestSize) { bestSize = qt; best = n }
  }
  const out = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) out[i] = lab[i] === best ? 1 : 0
  return out
}

function rowRuns(m, W, y) {
  const runs = []
  let x = 0
  while (x < W) {
    while (x < W && !m[y * W + x]) x++
    if (x >= W) break
    const a = x
    while (x < W && m[y * W + x]) x++
    runs.push([a, x - 1])
  }
  return runs
}

function fitLine(ys, xs) {
  const n = ys.length
  const my = ys.reduce((a, b) => a + b, 0) / n, mx = xs.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) { num += (ys[i] - my) * (xs[i] - mx); den += (ys[i] - my) ** 2 }
  const b = den ? num / den : 0
  return (y) => mx + b * (y - my)
}

/**
 * Remove the neck from a headstock-up full-guitar silhouette.
 * Returns the body mask plus neck edge lines and pocket corner positions.
 */
function removeNeck(m, W, H, o = {}) {
  let maxW = 0, bodyTop = -1
  const widths = []
  for (let y = 0; y < H; y++) {
    const r = rowRuns(m, W, y)
    const w = r.length ? r[r.length - 1][1] - r[0][0] : 0
    widths.push(w)
    if (w > maxW) maxW = w
  }
  for (let y = 0; y < H; y++) if (widths[y] > maxW * 0.55) { bodyTop = y; break }
  // neck centre from mid-neck rows
  const yMid = Math.round(bodyTop * (o.midFrac ?? 0.62))
  const r0 = rowRuns(m, W, yMid)
  let cx = r0.length ? (r0[0][0] + r0[r0.length - 1][1]) / 2 : W / 2
  const ys = [], xl = [], xr = []
  const y0 = Math.round(bodyTop * (o.fitFrom ?? 0.55)), y1 = Math.round(bodyTop * (o.fitTo ?? 0.82))
  for (let y = y0; y < y1; y++) {
    const run = rowRuns(m, W, y).find((r) => r[0] <= cx && r[1] >= cx)
    if (!run || run[1] - run[0] > maxW * 0.22) continue
    ys.push(y); xl.push(run[0]); xr.push(run[1])
    cx = (run[0] + run[1]) / 2
  }
  const L = fitLine(ys, xl), R = fitLine(ys, xr)
  const off = o.edgeOffset ?? 3
  const scanDown = (xf) => {
    for (let y = y1; y < H; y++) {
      const x = Math.round(xf(y))
      if (m[y * W + x]) return y
    }
    return H - 1
  }
  const yL = scanDown((y) => L(y) - off)
  const yR = scanDown((y) => R(y) + off)
  const out = m.slice()
  for (let y = 0; y < Math.max(yL, yR); y++) {
    const xa = Math.floor(L(y)) - 1, xb = Math.ceil(R(y)) + 1
    for (let x = Math.max(0, xa); x <= Math.min(W - 1, xb); x++) {
      // cut line from (L(yL), yL) to (R(yR), yR)
      const t = (x - L(yL)) / (R(yR) - L(yL))
      const yc = yL + (yR - yL) * Math.min(1, Math.max(0, t))
      if (y < yc) out[y * W + x] = 0
    }
  }
  return { mask: largest(out, W, H), L, R, yL, yR, xL: L(yL), xR: R(yR), widthAtPocket: R((yL + yR) / 2) - L((yL + yR) / 2), cx: (L(yL) + R(yR)) / 2, fitRows: ys.length, bodyTop }
}

/** Moore-neighbour boundary trace of the largest blob. */
function contour(m, W, H) {
  let s = -1
  for (let i = 0; i < W * H; i++) if (m[i]) { s = i; break }
  const D = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]]
  const idx = (dx, dy) => D.findIndex((d) => d[0] === dx && d[1] === dy)
  const sx = s % W, sy = (s / W) | 0
  let x = sx, y = sy, b = 0
  const pts = [[x, y]]
  const on = (px, py) => px >= 0 && py >= 0 && px < W && py < H && m[py * W + px]
  for (let guard = 0; guard < 5e6; guard++) {
    let found = false
    for (let k = 1; k <= 8; k++) {
      const d = (b + k) % 8
      const nx = x + D[d][0], ny = y + D[d][1]
      if (on(nx, ny)) {
        const pd = (b + k - 1) % 8
        const px = x + D[pd][0], py = y + D[pd][1]
        x = nx; y = ny
        b = idx(px - x, py - y)
        found = true
        break
      }
    }
    if (!found) break
    if (x === sx && y === sy) break
    pts.push([x, y])
  }
  return pts
}

function smooth(pts, sigma = 2) {
  const n = pts.length, r = Math.ceil(sigma * 3)
  const w = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)))
  const ws = w.reduce((a, b) => a + b, 0)
  return pts.map((_, i) => {
    let x = 0, y = 0
    for (let k = -r; k <= r; k++) { const p = pts[(i + k + n) % n]; x += p[0] * w[k + r]; y += p[1] * w[k + r] }
    return [x / ws, y / ws]
  })
}

function resample(pts, step) {
  const out = [pts[0]]
  let acc = 0
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1], b = pts[i % pts.length]
    let seg = Math.hypot(b[0] - a[0], b[1] - a[1])
    let t0 = 0
    while (acc + seg * (1 - t0) >= step) {
      const t = t0 + (step - acc) / seg
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      t0 = t
      acc = 0
    }
    acc += seg * (1 - t0)
  }
  return out
}

function show(c, mask, pts, extra = [], box = 900) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const x0 = Math.max(0, Math.min(...xs) - 20), y0 = Math.max(0, Math.min(...ys) - 20)
  const x1 = Math.min(c.width, Math.max(...xs) + 20), y1 = Math.min(c.height, Math.max(...ys) + 20)
  const k = box / Math.max(x1 - x0, y1 - y0)
  const view = document.createElement('canvas')
  view.width = (x1 - x0) * k
  view.height = (y1 - y0) * k
  const g = view.getContext('2d')
  g.fillStyle = '#ccc'
  g.fillRect(0, 0, view.width, view.height)
  g.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, view.width, view.height)
  g.translate(-x0 * k, -y0 * k)
  g.strokeStyle = '#00e'
  g.lineWidth = 1.5
  g.beginPath()
  pts.forEach((p, i) => (i ? g.lineTo(p[0] * k, p[1] * k) : g.moveTo(p[0] * k, p[1] * k)))
  g.closePath()
  g.stroke()
  g.fillStyle = '#f00'
  for (const p of extra) { g.beginPath(); g.arc(p[0] * k, p[1] * k, 4, 0, 7); g.fill() }
  return view
}

window.T = { load, toMask, fillHoles, largest, removeNeck, contour, smooth, resample, show, rowRuns }

// ---- session helpers -------------------------------------------------------
window.R = {}
window.body = async function (name, src, o = {}) {
  const c = await load(src, o.h ?? 3000, o.rotate ?? 0)
  const W = c.width, H = c.height
  let m = toMask(c, o.mode ?? 'alpha', o.tol)
  m = largest(fillHoles(m, W, H), W, H)
  if (o.mutate) o.mutate(m, W, H)
  let nk = null, mask = m
  if (o.neck !== false) { nk = removeNeck(m, W, H, o.neck || {}); mask = nk.mask }
  const pts = smooth(contour(mask, W, H), o.sigma ?? 2)
  const v = show(c, mask, pts, nk ? [[nk.xL, nk.yL], [nk.xR, nk.yR]] : [], o.box ?? 480)
  const f = document.createElement('figure')
  f.style.margin = '0'
  f.append(v, Object.assign(document.createElement('figcaption'), { textContent: name + (nk ? ` neckW=${nk.widthAtPocket.toFixed(1)}px yL=${nk.yL} yR=${nk.yR}` : ` ${W}x${H}`) }))
  document.getElementById('out').append(f)
  R[name] = { W, H, pts, c, lines: nk && { L: nk.L, R: nk.R }, nk: nk && { xL: nk.xL, xR: nk.xR, yL: nk.yL, yR: nk.yR, w: nk.widthAtPocket, cx: nk.cx } }
  return R[name].nk
}
/** mm, origin at neck centre on the higher pocket corner, y up. */
window.norm = function (name, heelMm) {
  const r = R[name], k = heelMm / r.nk.w, y0 = Math.min(r.nk.yL, r.nk.yR)
  return { k, pocketL: [(r.nk.xL - r.nk.cx) * k, (y0 - r.nk.yL) * k], pocketR: [(r.nk.xR - r.nk.cx) * k, (y0 - r.nk.yR) * k], pts: r.pts.map((p) => [(p[0] - r.nk.cx) * k, (y0 - p[1]) * k]) }
}
window.bbox = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}
/** Overlay several mm outlines (y up). */
window.overlay = function (sets, label = '', size = 560) {
  const all = sets.flatMap((s) => s.pts)
  const b = bbox(all)
  const k = (size - 20) / Math.max(b.w, b.h)
  const c = document.createElement('canvas')
  c.width = b.w * k + 20
  c.height = b.h * k + 20
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  g.fillRect(0, 0, c.width, c.height)
  g.strokeStyle = '#ddd'
  for (let x = Math.ceil(b.minX / 50) * 50; x < b.maxX; x += 50) { g.beginPath(); g.moveTo((x - b.minX) * k + 10, 0); g.lineTo((x - b.minX) * k + 10, c.height); g.stroke() }
  for (let y = Math.ceil(b.minY / 50) * 50; y < b.maxY; y += 50) { g.beginPath(); g.moveTo(0, (b.maxY - y) * k + 10); g.lineTo(c.width, (b.maxY - y) * k + 10); g.stroke() }
  const cols = ['#d00', '#06c', '#090', '#a0a', '#e80']
  sets.forEach((s, i) => {
    g.strokeStyle = s.color ?? cols[i % cols.length]
    g.lineWidth = s.width ?? 1.5
    g.beginPath()
    s.pts.forEach((p, j) => { const x = (p[0] - b.minX) * k + 10, y = (b.maxY - p[1]) * k + 10; j ? g.lineTo(x, y) : g.moveTo(x, y) })
    if (!s.open) g.closePath()
    g.stroke()
    for (const q of s.marks ?? []) { g.fillStyle = g.strokeStyle; g.beginPath(); g.arc((q[0] - b.minX) * k + 10, (b.maxY - q[1]) * k + 10, 4, 0, 7); g.fill() }
  })
  const f = document.createElement('figure')
  f.style.margin = '0'
  f.append(c, Object.assign(document.createElement('figcaption'), { textContent: label }))
  document.getElementById('out').append(f)
}
window.clearOut = () => (document.getElementById('out').innerHTML = '')

/** Find fret-marker blobs along the neck and fit scale length + bridge position (px). */
window.frets = function (name, o = {}) {
  const r = R[name], c = r.c, g = c.getContext('2d'), W = c.width
  const L = r.lines.L, Rr = r.lines.R
  const yTop = o.yTop ?? Math.round(Math.min(r.nk.yL, r.nk.yR) * 0.12), yBot = o.yBot ?? Math.max(r.nk.yL, r.nk.yR) + (o.extra ?? 0)
  const prof = []
  for (let y = yTop; y < yBot; y++) {
    const a = L(y), b = Rr(y), w = b - a
    const x0 = Math.round(a + w * 0.12), x1 = Math.round(b - w * 0.12)
    const d = g.getImageData(x0, y, Math.max(1, x1 - x0), 1).data
    let mx = 0, sum = 0
    for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i + 1] + d[i + 2]; sum += v; if (v > mx) mx = v }
    prof.push({ y, mx, mean: sum / (d.length / 4) })
  }
  // markers: rows whose max brightness clearly exceeds the board's typical brightness
  const means = prof.map((p) => p.mean).sort((a, b) => a - b)
  const base = means[means.length >> 1]
  const thr = o.thr ?? base + (765 - base) * 0.45
  const blobs = []
  let cur = null
  for (const p of prof) {
    if (p.mx > thr) { if (!cur) cur = { a: p.y, b: p.y }; else cur.b = p.y }
    else if (cur) { if (cur.b - cur.a >= (o.minRows ?? 3)) blobs.push(cur); cur = null }
  }
  const centres = blobs.map((b) => (b.a + b.b) / 2)
  return { base, thr, centres, sizes: blobs.map((b) => b.b - b.a) }
}
window.fitScale = function (centres, fretNums) {
  const f = (n) => (Math.pow(2, -(n - 1) / 12) + Math.pow(2, -n / 12)) / 2
  // y = yB - Lpx * f(n)  -> least squares on (yB, Lpx)
  const X = fretNums.map(f), Y = centres
  const n = X.length, mx = X.reduce((a, b) => a + b) / n, my = Y.reduce((a, b) => a + b) / n
  let sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2 }
  const slope = sxy / sxx, Lpx = -slope, yB = my - slope * mx
  const res = Y.map((y, i) => y - (yB - Lpx * X[i]))
  return { Lpx, yB, yNut: yB - Lpx, resid: res.map((v) => +v.toFixed(1)) }
}

/** Morphological opening (octagonal element) to shave off strap buttons and similar nubs. */
function erode(m, W, H, it) {
  let a = m
  for (let k = 0; k < it; k++) {
    const b = new Uint8Array(W * H), eight = k % 2 === 1
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      if (!a[i]) continue
      let ok = a[i - 1] && a[i + 1] && a[i - W] && a[i + W]
      if (ok && eight) ok = a[i - W - 1] && a[i - W + 1] && a[i + W - 1] && a[i + W + 1]
      b[i] = ok ? 1 : 0
    }
    a = b
  }
  return a
}
function dilate(m, W, H, it) {
  let a = m
  for (let k = 0; k < it; k++) {
    const b = a.slice(), eight = k % 2 === 1
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      if (a[i]) continue
      let on = a[i - 1] || a[i + 1] || a[i - W] || a[i + W]
      if (!on && eight) on = a[i - W - 1] || a[i - W + 1] || a[i + W - 1] || a[i + W + 1]
      if (on) b[i] = 1
    }
    a = b
  }
  return a
}
window.openMask = (m, W, H, r) => dilate(erode(m, W, H, r), W, H, r)

window.peaks = function (sig, thr = 0.85, gap = 6) {
  const out = []
  for (let i = 2; i < sig.length - 2; i++) {
    const s = sig[i]
    if (s.f > thr && s.f >= sig[i - 1].f && s.f >= sig[i + 1].f && s.f >= sig[i - 2].f && s.f >= sig[i + 2].f) {
      if (!out.length || s.y - out[out.length - 1] > gap) out.push(s.y)
    }
  }
  return out
}
/** Longest run of peaks whose spacing shrinks like frets do. */
window.fretRun = function (ys, lo = 0.88, hi = 0.99) {
  let best = [], cur = [ys[0], ys[1]]
  for (let i = 2; i < ys.length; i++) {
    const d1 = ys[i - 1] - ys[i - 2], d2 = ys[i] - ys[i - 1]
    const r = d2 / d1
    if (r > lo && r < hi) cur.push(ys[i])
    else { if (cur.length > best.length) best = cur; cur = [ys[i - 1], ys[i]] }
  }
  if (cur.length > best.length) best = cur
  return best
}

/**
 * Re-trace a body with strap buttons removed and convert to template mm space:
 * x across (bass -), y along strings with the bridge saddle line at 0.
 */
window.finalize = function (name, fit, scale, o = {}) {
  const r = R[name], W = r.W, H = r.H
  const mm = scale / fit.Lpx
  // rebuild the body mask (same as body())
  let m = toMask(r.c, o.mode ?? 'alpha', o.tol)
  m = largest(fillHoles(m, W, H), W, H)
  if (o.mutate) o.mutate(m, W, H)
  const nk = removeNeck(m, W, H, o.neck || {})
  let mask = nk.mask
  const rad = Math.round((o.openMm ?? 4.5) / mm)
  if (rad > 0) mask = largest(openMask(mask, W, H, rad), W, H)
  const pts = smooth(contour(mask, W, H), o.sigma ?? 2.5)
  // neck axis: average slope of the fitted edges -> rotate so the neck is vertical
  const yA = nk.yL - 600, yB2 = Math.min(nk.yL, nk.yR)
  const cxA = (nk.L(yA) + nk.R(yA)) / 2, cxB = (nk.L(yB2) + nk.R(yB2)) / 2
  const ang = Math.atan2(cxB - cxA, yB2 - yA) // + when the neck leans right going down
  const ox = cxB, oy = yB2
  const rot = (x, y) => { const dx = x - ox, dy = y - oy, c = Math.cos(ang), s = Math.sin(ang); return [ox + dx * c - dy * s, oy + dx * s + dy * c] }
  const yBr = rot(ox, fit.yB)[1]
  const tf = (p) => { const q = rot(p[0], p[1]); return [(q[0] - ox) * mm, (yBr - q[1]) * mm] }
  const out = { pts: pts.map(tf), pocketL: tf([nk.xL, nk.yL]), pocketR: tf([nk.xR, nk.yR]), mm, angleDeg: (ang * 180) / Math.PI }
  const b = bbox(out.pts)
  out.stats = { w: +b.w.toFixed(1), h: +b.h.toFixed(1), tail: +b.minY.toFixed(1), top: +b.maxY.toFixed(1), left: +b.minX.toFixed(1), right: +b.maxX.toFixed(1), neckW: +(nk.widthAtPocket * mm).toFixed(1), pocketL: out.pocketL.map((v) => +v.toFixed(1)), pocketR: out.pocketR.map((v) => +v.toFixed(1)) }
  return out
}

/** Per-row "fret-ness": share of board columns brighter (or darker) than their own median. */
window.fretRows = function (name, y0, y1, frac = 0.8, o = {}) {
  const r = R[name], g = r.c.getContext('2d'), L = r.lines.L, Rr = r.lines.R
  const rows = []
  for (let y = y0; y < y1; y++) {
    const a = L(y), b = Rr(y), w = b - a, x0 = Math.round(a + (w * (1 - frac)) / 2), x1 = Math.round(b - (w * (1 - frac)) / 2)
    const d = g.getImageData(x0, y, Math.max(2, x1 - x0), 1).data
    const v = []
    for (let i = 0; i < d.length; i += 4) v.push(d[i + 3] < 40 ? 765 : d[i] + d[i + 1] + d[i + 2])
    rows.push(v)
  }
  const N = 60
  const S = rows.map((v) => Array.from({ length: N }, (_, k) => v[Math.min(v.length - 1, Math.floor((k * v.length) / N))]))
  const med = Array.from({ length: N }, (_, k) => { const col = S.map((s) => s[k]).sort((a, b) => a - b); return col[col.length >> 1] })
  const margin = o.margin ?? 60
  return S.map((s, i) => ({ y: y0 + i, f: s.filter((v, k) => (o.dark ? v < med[k] - margin : v > med[k] + margin)).length / N }))
}
/** y = yB - Lpx * 2^(-(i+k0)/12) least squares. */
window.fitFrets = function (ys, k0 = 0) {
  const X = ys.map((_, i) => Math.pow(2, -(i + k0) / 12)), n = X.length
  const mx = X.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n
  let sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) { sxy += (X[i] - mx) * (ys[i] - my); sxx += (X[i] - mx) ** 2 }
  const slope = sxy / sxx, Lpx = -slope, yB = my - slope * mx
  return { Lpx, yB, k0, resid: ys.map((y, i) => +(y - (yB - Lpx * X[i])).toFixed(1)) }
}
window.urlOf = async (title) => {
  const j = await fetch('https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json&prop=imageinfo&iiprop=url&titles=' + encodeURIComponent(title)).then((r) => r.json())
  return Object.values(j.query.pages)[0].imageinfo[0].url
}
window.F = {}

// ---- control-point fitting (same centripetal Catmull-Rom as the app) ---------
function catmull(p0, p1, p2, p3, t) {
  const d = (a, b) => Math.max(1e-4, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5))
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3)
  const tt = t1 + (t2 - t1) * t
  const L = (a, b, ta, tb) => { const k = (tt - ta) / (tb - ta); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] }
  const a1 = L(p0, p1, t0, t1), a2 = L(p1, p2, t1, t2), a3 = L(p2, p3, t2, t3)
  const b1 = L(a1, a2, t0, t2), b2 = L(a2, a3, t1, t3)
  return L(b1, b2, t1, t2)
}
function segPts(P, i, n = 12) {
  const N = P.length, p1 = P[i], p2 = P[(i + 1) % N]
  const p0 = p1.corner ? p1 : P[(i - 1 + N) % N], p3 = p2.corner ? p2 : P[(i + 2) % N]
  const out = []
  for (let s = 0; s <= n; s++) {
    const t = s / n
    out.push(p1.corner && p2.corner ? [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t] : catmull(p0, p1, p2, p3, t))
  }
  return out
}
/**
 * dense: closed polyline (mm). corners: indices into dense that must stay sharp.
 * Returns control points (arrays with .corner) whose spline stays within tol of dense.
 */
window.toControl = function (dense, cornerIdx = [], tol = 0.6, start = 30, extra = {}) {
  const D = resample(dense, 1)
  // map corner indices to the resampled polyline
  const near = (p) => { let b = 0, bd = Infinity; D.forEach((q, i) => { const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (d < bd) { bd = d; b = i } }); return b }
  const cI = cornerIdx.map((i) => near(dense[i]))
  let idx = new Set(cI)
  for (let i = 0; i < D.length; i += start) idx.add(i)
  const build = () => [...idx].sort((a, b) => a - b).map((i) => Object.assign([D[i][0], D[i][1]], { i, corner: cI.includes(i), pocket: extra[i] }))
  for (let guard = 0; guard < 400; guard++) {
    const P = build()
    let worst = -1, wd = 0
    for (let s = 0; s < P.length; s++) {
      const a = P[s].i, b = s + 1 < P.length ? P[s + 1].i : P[0].i + D.length
      if (b - a < 2) continue
      const curve = segPts(P, s, Math.max(8, b - a))
      for (let k = a + 1; k < b; k++) {
        const q = D[k % D.length]
        let md = Infinity
        for (const c of curve) md = Math.min(md, Math.hypot(c[0] - q[0], c[1] - q[1]))
        if (md > wd) { wd = md; worst = s }
      }
    }
    if (wd <= tol) return { P, maxDev: wd, cI }
    const a = P[worst].i, b = worst + 1 < P.length ? P[worst + 1].i : P[0].i + D.length
    idx.add(Math.round((a + b) / 2) % D.length)
  }
  return { P: build(), maxDev: -1, cI }
}
window.cornerIndex = (pts, p) => { let b = 0, bd = Infinity; pts.forEach((q, i) => { const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (d < bd) { bd = d; b = i } }); return b }
/** Rotate so the list starts at the bass pocket corner and runs counter-clockwise (bass side first). */
window.emit = function (P, pocketLi, pocketRi) {
  let s = P.findIndex((p) => p.i === pocketLi)
  let arr = [...P.slice(s), ...P.slice(0, s)]
  // ensure CCW: after the bass pocket corner we should move toward -x (the bass horn)
  const area = arr.reduce((a, p, i) => { const q = arr[(i + 1) % arr.length]; return a + p[0] * q[1] - q[0] * p[1] }, 0)
  if (area < 0) arr = [arr[0], ...arr.slice(1).reverse()]
  return arr.map((p) => {
    const flags = []
    if (p.i === pocketLi) flags.push("corner: true, pocket: 'L'")
    else if (p.i === pocketRi) flags.push("corner: true, pocket: 'R'")
    else if (p.corner) flags.push('corner: true')
    return flags.length ? `P(${p[0].toFixed(1)}, ${p[1].toFixed(1)}, { ${flags.join(', ')} })` : `[${p[0].toFixed(1)}, ${p[1].toFixed(1)}]`
  })
}
/** Full pipeline for a finalized body: control points + preview overlay. */
window.makeTemplate = function (key, tol = 0.6) {
  const f = F[key]
  const iL = cornerIndex(f.pts, f.pocketL), iR = cornerIndex(f.pts, f.pocketR)
  const res = toControl(f.pts, [iL, iR], tol, 30)
  const lines = emit(res.P, res.cI[0], res.cI[1])
  // preview: dense (grey) vs spline through control points (red)
  const P = res.P, spline = []
  for (let s = 0; s < P.length; s++) spline.push(...segPts(P, s, 10))
  overlay([{ pts: f.pts, color: '#bbb', width: 4 }, { pts: spline, color: '#d00', width: 1.2, marks: P }], `${key}: ${P.length} pts, max dev ${res.maxDev.toFixed(2)} mm`)
  return { n: P.length, maxDev: +res.maxDev.toFixed(2), code: lines.join(', ') }
}
