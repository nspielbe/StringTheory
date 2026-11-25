async function raster(S, crop, pxmm) {
  const ppu = pxmm * S.k;
  const W = Math.round(crop[2] * ppu), H = Math.round(crop[3] * ppu);
  const t = S.text.replace(/viewBox="[^"]+"/, `viewBox="${crop.join(' ')}"`).replace(/width="[^"]+" height="[^"]+"/, `width="${W}" height="${H}"`).replace(/stroke-width="[^"]+"/, `stroke-width="${(1.6 / ppu).toFixed(6)}"`);
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([t], { type: 'image/svg+xml' }));
  await img.decode();
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H).data;
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) m[i] = d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] < (window.JOB.thr || 600) ? 1 : 0;
  return { m, W, H, ppu };
}
function morph(m, W, H, r, dil) {
  // separable square kernel via running counts
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { const row = y * W; let cnt = 0;
    for (let x = -r; x < W; x++) { const add = x + r; if (add < W && m[row + add]) cnt++; const rem = x - r - 1; if (rem >= 0 && m[row + rem]) cnt--; if (x >= 0) tmp[row + x] = dil ? (cnt > 0 ? 1 : 0) : (cnt === Math.min(W - 1, x + r) - Math.max(0, x - r) + 1 ? 1 : 0); } }
  for (let x = 0; x < W; x++) { let cnt = 0;
    for (let y = -r; y < H; y++) { const add = y + r; if (add < H && tmp[add * W + x]) cnt++; const rem = y - r - 1; if (rem >= 0 && tmp[rem * W + x]) cnt--; if (y >= 0) out[y * W + x] = dil ? (cnt > 0 ? 1 : 0) : (cnt === Math.min(H - 1, y + r) - Math.max(0, y - r) + 1 ? 1 : 0); } }
  return out;
}
function fillFromBorder(m, W, H) {
  const inside = new Uint8Array(W * H).fill(1); const q = new Int32Array(W * H); let qh = 0, qt = 0;
  const push = (i) => { if (!m[i] && inside[i]) { inside[i] = 0; q[qt++] = i; } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (qh < qt) { const i = q[qh++]; const x = i % W; if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (i >= W) push(i - W); if (i < W * (H - 1)) push(i + W); }
  return inside;
}
function largest(m, W, H) {
  const lab = new Int32Array(W * H); const q = new Int32Array(W * H); let best = 0, bestN = 0, cur = 0;
  for (let s = 0; s < W * H; s++) { if (!m[s] || lab[s]) continue; cur++; let qh = 0, qt = 0; q[qt++] = s; lab[s] = cur; let n = 0;
    while (qh < qt) { const i = q[qh++]; n++; const x = i % W;
      if (x > 0 && m[i - 1] && !lab[i - 1]) { lab[i - 1] = cur; q[qt++] = i - 1; }
      if (x < W - 1 && m[i + 1] && !lab[i + 1]) { lab[i + 1] = cur; q[qt++] = i + 1; }
      if (i >= W && m[i - W] && !lab[i - W]) { lab[i - W] = cur; q[qt++] = i - W; }
      if (i < W * (H - 1) && m[i + W] && !lab[i + W]) { lab[i + W] = cur; q[qt++] = i + W; } }
    if (n > bestN) { bestN = n; best = cur; } }
  const out = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) out[i] = lab[i] === best ? 1 : 0; return { out, n: bestN };
}
function contour(m, W, H) {
  let s = -1; for (let i = 0; i < W * H; i++) if (m[i]) { s = i; break; }
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[y * W + x];
  let x = s % W, y = (s / W) | 0; const sx = x, sy = y; let dir = 6; const pts = [];
  for (let guard = 0; guard < 4 * (W + H) * 50; guard++) {
    pts.push([x, y]);
    let found = false;
    for (let k = 0; k < 8; k++) { const d = (dir + 6 + k) % 8; const nx = x + dirs[d][0], ny = y + dirs[d][1]; if (at(nx, ny)) { x = nx; y = ny; dir = d; found = true; break; } }
    if (!found || (x === sx && y === sy && pts.length > 2)) break;
  }
  return pts;
}
(async () => {
  const out = document.getElementById('out');
  try {
    const J = window.JOB;
    const S = { text: J.svg, k: J.k };
    const R = await raster(S, J.crop, J.pxmm);
    let m = J.close ? morph(R.m, R.W, R.H, J.close, true) : R.m;
    let inside;
    if (J.seed) {
      // region of empty pixels connected to the seed, then everything it encloses
      const W = R.W, H = R.H, reg = new Uint8Array(W * H), q = new Int32Array(W * H); let qh = 0, qt = 0;
      const s0 = Math.round((J.seed[1] - J.crop[1]) * R.ppu) * W + Math.round((J.seed[0] - J.crop[0]) * R.ppu);
      reg[s0] = 1; q[qt++] = s0;
      while (qh < qt) { const i = q[qh++]; const x = i % W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < W * (H - 1) ? i + W : -1]) if (j >= 0 && !reg[j] && !m[j]) { reg[j] = 1; q[qt++] = j; } }
      inside = morph(fillFromBorder(reg, W, H), W, H, (J.close || 0) + 1, true);
    } else inside = fillFromBorder(m, R.W, R.H);
    if (J.open) inside = morph(morph(inside, R.W, R.H, J.open, false), R.W, R.H, J.open, true);
    if (J.close) inside = morph(inside, R.W, R.H, J.close, false);
    if (J.post) inside = morph(morph(inside, R.W, R.H, J.post, true), R.W, R.H, J.post, false);
    const L = largest(inside, R.W, R.H);
    const px = contour(L.out, R.W, R.H);
    const pts = px.map(([x, y]) => [+(J.crop[0] + (x + 0.5) / R.ppu).toFixed(4), +(J.crop[1] + (y + 0.5) / R.ppu).toFixed(4)]);
    // optional debug image of the filled silhouette
    let png = null;
    if (J.debug) { const c = document.createElement('canvas'); const s = Math.min(1, 1200 / R.W); c.width = Math.round(R.W * s); c.height = Math.round(R.H * s); const g = c.getContext('2d'); const id = new ImageData(R.W, R.H); for (let i = 0; i < R.W * R.H; i++) { const v = L.out[i] ? 120 : 255; const e = R.m[i] ? 0 : v; id.data[i * 4] = e; id.data[i * 4 + 1] = e; id.data[i * 4 + 2] = L.out[i] && !R.m[i] ? 200 : e; id.data[i * 4 + 3] = 255; } const t = document.createElement('canvas'); t.width = R.W; t.height = R.H; t.getContext('2d').putImageData(id, 0, 0); g.drawImage(t, 0, 0, c.width, c.height); png = c.toDataURL('image/png'); }
    // round holes inside the silhouette (tuner, knob, post holes): enclosed empty regions
    let holes = null;
    if (J.holes) {
      holes = [];
      const W = R.W, H = R.H, mm = R.m, inS = L.out;
      const seen = new Uint8Array(W * H); const q = new Int32Array(W * H);
      const amin = Math.PI * Math.pow(J.holes.dmin / 2 * J.pxmm, 2), amax = Math.PI * Math.pow(J.holes.dmax / 2 * J.pxmm, 2);
      for (let s = 0; s < W * H; s++) {
        if (seen[s] || mm[s] || !inS[s]) continue;
        let qh = 0, qt = 0; q[qt++] = s; seen[s] = 1; let n = 0, sx = 0, sy = 0, x0 = W, x1 = 0, y0 = H, y1 = 0, edge = false;
        while (qh < qt) { const i = q[qh++]; n++; const x = i % W, y = (i / W) | 0; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) { if (j < 0) { edge = true; continue; } if (!seen[j] && !mm[j]) { if (!inS[j]) edge = true; seen[j] = 1; q[qt++] = j; } }
          if (qt > amax * 4) break; }
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
        if (!edge && n <= amax) { const f = (v, o) => +(J.crop[o] + v / R.ppu).toFixed(3);
          holes.push([f(x0, 0), f(y0, 1), f(x1 + 1, 0), f(y1 + 1, 1), +(n / (J.pxmm * J.pxmm)).toFixed(2)]); }
      }
    }
    // optional: dark rows along a vertical neck (columns x±offset mm), for raster fret detection
    let frets = null;
    if (J.frets) {
      const F = J.frets; frets = [];
      const horiz = F.y !== undefined;
      for (const off of [-F.offset, F.offset]) {
        const line = horiz ? Math.round((F.y + off - J.crop[1]) * R.ppu) : Math.round((F.x + off - J.crop[0]) * R.ppu);
        const N = horiz ? R.W : R.H; const prof = [];
        for (let t = 0; t < N; t++) { let s = 0; for (let d = -1; d <= 1; d++) s += horiz ? R.m[(line + d) * R.W + t] : R.m[t * R.W + line + d]; prof.push(s); }
        const rows = [];
        for (let t = 1; t < N; t++) if (prof[t] >= 2 && prof[t - 1] < 2) { let e = t; while (e < N && prof[e] >= 2) e++; rows.push(+(J.crop[horiz ? 0 : 1] + ((t + e - 1) / 2 + 0.5) / R.ppu).toFixed(3)); t = e; }
        frets.push(rows);
      }
    }
    out.textContent = JSON.stringify({ ok: true, W: R.W, H: R.H, area: L.n, pts, png, frets, holes });
  } catch (e) { out.textContent = JSON.stringify({ ok: false, err: String(e && e.stack || e) }); }
})();
