import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import type { BodyShapeData, HeadstockShapeData, ShapePoint, Vec2 } from '../types'
import { useStore } from '../store'
import { BODY_TEMPLATES, PICKGUARD_TEMPLATES, bodyTemplate } from '../data/bodyShapes'
import { HEADSTOCK_TEMPLATES, headstockTemplate } from '../data/headstockShapes'
import { bounds, sampleOutline, spread, toSvgPath } from '../lib/geometry'
import { fretboardEndY, neckWidthAt, placePickups, resolveBody } from '../lib/layout'
import { fileToDataUrl } from '../lib/imageStore'
import { FileButton, Modal, Row, Section, Select, Slider, Toggle } from './controls'

type Kind = 'body' | 'head' | 'guard'

interface EditState {
  points: ShapePoint[]
  body?: Omit<BodyShapeData, 'points'>
  head?: Omit<HeadstockShapeData, 'points'>
}

type Handle = { kind: 'pt'; i: number } | { kind: 'knob'; i: number } | { kind: 'switch' } | { kind: 'jack' } | { kind: 'strap'; i: number } | { kind: 'pocket' } | { kind: 'tuner'; line: 'a' | 'b'; end: 0 | 1 }

function initial(kind: Kind): EditState {
  const d = useStore.getState().design
  if (kind === 'body') {
    const s = structuredClone(d.body.custom ?? bodyTemplate(d.body.shapeId).shape)
    const { points, ...rest } = s
    return { points, body: rest }
  }
  if (kind === 'head') {
    const s = structuredClone(d.headstock.custom ?? headstockTemplate(d.headstock.shapeId).shape)
    const { points, ...rest } = s
    return { points, head: rest }
  }
  const src = d.pickguard.shape?.points ?? PICKGUARD_TEMPLATES[bodyTemplate(d.body.shapeId).defaults.pickguard ?? 's-guard'] ?? PICKGUARD_TEMPLATES['s-guard']
  return { points: structuredClone(src) }
}

function mirrorLeft(points: ShapePoint[]): ShapePoint[] {
  let start = points.findIndex((p) => p.pocket === 'L')
  if (start < 0) start = 0
  const rot = [...points.slice(start), ...points.slice(0, start)]
  const left = rot.filter((p) => p.x <= 0.5)
  const right = [...left]
    .reverse()
    .filter((p) => Math.abs(p.x) > 0.5)
    .map((p) => ({ ...p, x: -p.x, pocket: p.pocket === 'L' ? ('R' as const) : p.pocket === 'R' ? ('L' as const) : undefined }))
  return [...left, ...right]
}

export function ShapeEditor({ kind }: { kind: Kind }) {
  const close = () => useStore.getState().openModal(null)
  const set = useStore((s) => s.set)
  const d = useStore((s) => s.design)
  const [st, setSt] = useState<EditState>(() => initial(kind))
  const [hist, setHist] = useState<EditState[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [mirror, setMirror] = useState(kind === 'head')
  const [ref, setRef] = useState<{ url: string; w: number; h: number; mmPerPx: number; x: number; y: number; rot: number; opacity: number } | null>(null)
  const [stretch, setStretch] = useState({ w: 100, h: 100 })
  const svgRef = useRef<SVGSVGElement>(null)

  const commit = useCallback((next: EditState) => {
    setHist((h) => [...h.slice(-60), st])
    setSt(next)
  }, [st])

  const outline = useMemo(() => sampleOutline(st.points, 2), [st.points])
  const b = bounds(outline)
  const [vb, setVb] = useState(() => {
    const bb = bounds(sampleOutline(st.points, 4))
    const pad = Math.max(bb.w, bb.h) * 0.25
    return { x: bb.minX - pad, y: -bb.maxY - pad, w: bb.w + pad * 2, h: bb.h + pad * 2 }
  })

  const toMm = (e: { clientX: number; clientY: number }): Vec2 => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return { x: p.x, y: -p.y }
  }

  const drag = useRef<{ h: Handle; mirrorIdx: number | null; startState: EditState; moved: boolean } | null>(null)
  const pan = useRef<{ x: number; y: number; vb: typeof vb } | null>(null)

  const startDrag = (h: Handle) => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    let mirrorIdx: number | null = null
    if (h.kind === 'pt') {
      setSel(h.i)
      if (mirror) {
        const p = st.points[h.i]
        let best = -1
        let bd = 4
        st.points.forEach((q, j) => {
          if (j === h.i) return
          const dd = Math.hypot(q.x + p.x, q.y - p.y)
          if (dd < bd) {
            bd = dd
            best = j
          }
        })
        mirrorIdx = best >= 0 ? best : null
      }
    }
    drag.current = { h, mirrorIdx, startState: st, moved: false }
  }

  const onMove = (e: React.PointerEvent) => {
    if (pan.current) {
      const svg = svgRef.current!
      const r = svg.getBoundingClientRect()
      const k = pan.current.vb.w / r.width
      setVb({ ...pan.current.vb, x: pan.current.vb.x - (e.clientX - pan.current.x) * k, y: pan.current.vb.y - (e.clientY - pan.current.y) * k })
      return
    }
    const dr = drag.current
    if (!dr) return
    dr.moved = true
    const p = toMm(e)
    const snap = (v: number) => Math.round(v * 2) / 2
    const x = snap(p.x)
    const y = snap(p.y)
    setSt((s) => {
      const n = structuredClone(s)
      const h = dr.h
      if (h.kind === 'pt') {
        const pt = n.points[h.i]
        if (pt.pocket) pt.y = y
        else {
          pt.x = Math.abs(x) < 1 && mirror ? 0 : x
          pt.y = y
        }
        if (dr.mirrorIdx !== null) {
          const m = n.points[dr.mirrorIdx]
          if (!m.pocket) m.x = -pt.x
          m.y = pt.y
        }
      } else if (n.body) {
        if (h.kind === 'knob') n.body.controls.knobs[h.i] = { x, y }
        else if (h.kind === 'switch') n.body.controls.switch = { x, y }
        else if (h.kind === 'jack') n.body.controls.jack = { x, y }
        else if (h.kind === 'strap') n.body.strapButtons[h.i] = { x, y }
        else if (h.kind === 'pocket') n.body.neckPocketY = y
      }
      if (n.head && h.kind === 'tuner') {
        const line = h.line === 'a' ? n.head.tuners.a : n.head.tuners.b!
        line[h.end] = { x, y }
      }
      return n
    })
  }

  const onUp = () => {
    const dr = drag.current
    if (dr?.moved) setHist((h) => [...h.slice(-60), dr.startState])
    drag.current = null
    pan.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    const p = toMm(e)
    const k = Math.exp(e.deltaY * 0.0015)
    setVb((v) => {
      const nx = p.x - (p.x - v.x) * k
      const ny = -p.y - (-p.y - v.y) * k
      return { x: nx, y: ny, w: v.w * k, h: v.h * k }
    })
  }

  const insertAt = (e: React.PointerEvent) => {
    e.stopPropagation()
    const p = toMm(e)
    // find the control segment nearest the click
    let best = 0
    let bd = Infinity
    const n = st.points.length
    for (let i = 0; i < n; i++) {
      const seg = sampleOutline([st.points[i], st.points[(i + 1) % n]].map((q, k) => ({ ...q, corner: true, _k: k })) as ShapePoint[], 2)
      for (const q of seg) {
        const dd = Math.hypot(q.x - p.x, q.y - p.y)
        if (dd < bd) {
          bd = dd
          best = i
        }
      }
    }
    const pts = [...st.points]
    pts.splice(best + 1, 0, { x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 })
    commit({ ...st, points: pts })
    setSel(best + 1)
  }

  const removeSel = useCallback(() => {
    if (sel === null || st.points.length <= 4 || st.points[sel].pocket) return
    commit({ ...st, points: st.points.filter((_, i) => i !== sel) })
    setSel(null)
  }, [sel, st, commit])

  const toggleCorner = useCallback(() => {
    if (sel === null) return
    const pts = st.points.map((p, i) => (i === sel ? { ...p, corner: !p.corner } : p))
    commit({ ...st, points: pts })
  }, [sel, st, commit])

  const undo = useCallback(() => {
    setHist((h) => {
      if (!h.length) return h
      setSt(h[h.length - 1])
      return h.slice(0, -1)
    })
  }, [])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'Delete' || e.key === 'Backspace') removeSel()
      else if (e.key === 'c' || e.key === 'C') toggleCorner()
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        e.stopPropagation()
        undo()
      }
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [removeSel, toggleCorner, undo])

  const save = () => {
    set((x) => {
      if (kind === 'body') x.body.custom = { points: st.points, ...st.body! }
      else if (kind === 'head') x.headstock.custom = { points: st.points, ...st.head! }
      else x.pickguard.shape = { points: st.points }
    })
    close()
  }

  const loadTemplate = (id: string) => {
    if (kind === 'body') {
      const t = structuredClone(bodyTemplate(id).shape)
      const { points, ...rest } = t
      commit({ points, body: rest })
    } else if (kind === 'head') {
      const t = structuredClone(headstockTemplate(id).shape)
      const { points, ...rest } = t
      commit({ points, head: rest })
    } else commit({ points: structuredClone(PICKGUARD_TEMPLATES[id]) })
  }

  const applyStretch = () => {
    const cx = 0
    const cy = kind === 'head' ? 0 : (b.minY + b.maxY) / 2
    const kx = stretch.w / 100
    const ky = stretch.h / 100
    const pts = st.points.map((p) => ({ ...p, x: p.pocket ? p.x : cx + (p.x - cx) * kx, y: cy + (p.y - cy) * ky }))
    const next: EditState = { ...st, points: pts }
    if (next.body) {
      const tr = (v: Vec2) => ({ x: cx + (v.x - cx) * kx, y: cy + (v.y - cy) * ky })
      next.body = { ...next.body, controls: { ...next.body.controls, knobs: next.body.controls.knobs.map(tr), switch: tr(next.body.controls.switch), jack: tr(next.body.controls.jack) }, strapButtons: next.body.strapButtons.map(tr) }
    }
    commit(next)
    setStretch({ w: 100, h: 100 })
  }

  // ---- reference geometry
  const body = resolveBody(d)
  const fbEnd = fretboardEndY(d)
  const pickups = kind !== 'head' ? placePickups(d) : []
  const r = vb.w / 900 // handle size scale
  const grid = useMemo(() => {
    const lines: ReactElement[] = []
    const step = vb.w > 600 ? 50 : 10
    for (let x = Math.floor(vb.x / step) * step; x < vb.x + vb.w; x += step) lines.push(<line key={'x' + x} x1={x} y1={vb.y} x2={x} y2={vb.y + vb.h} stroke={x === 0 ? '#5a4c3c' : '#221e1a'} strokeWidth={x === 0 ? 1.2 * r : 0.6 * r} />)
    for (let y = Math.floor(vb.y / step) * step; y < vb.y + vb.h; y += step) lines.push(<line key={'y' + y} x1={vb.x} y1={y} x2={vb.x + vb.w} y2={y} stroke={y === 0 ? '#5a4c3c' : '#221e1a'} strokeWidth={y === 0 ? 1.2 * r : 0.6 * r} />)
    return lines
  }, [vb, r])

  const posts = st.head && st.head.tuners.mode !== 'none' ? (st.head.tuners.mode === 'inline' ? spread(st.head.tuners.a[0], st.head.tuners.a[1], d.strings) : [...spread(st.head.tuners.a[0], st.head.tuners.a[1], Math.ceil(d.strings / 2)), ...spread(st.head.tuners.b![0], st.head.tuners.b![1], Math.floor(d.strings / 2))]) : []

  const title = kind === 'body' ? 'Body outline' : kind === 'head' ? 'Headstock outline' : 'Pickguard outline'
  const templates = kind === 'body' ? BODY_TEMPLATES.map((t) => ({ v: t.id, l: t.name })) : kind === 'head' ? HEADSTOCK_TEMPLATES.map((t) => ({ v: t.id, l: t.name })) : Object.keys(PICKGUARD_TEMPLATES).map((k) => ({ v: k, l: k === 's-guard' ? 'S-style guard' : 'T-style guard' }))

  return (
    <Modal
      title={title}
      onClose={close}
      foot={
        <>
          <span className="hint" style={{ marginRight: 'auto' }}>
            Width {b.w.toFixed(0)} mm ({(b.w / 25.4).toFixed(2)}") · Length {b.h.toFixed(0)} mm ({(b.h / 25.4).toFixed(2)}") · {st.points.length} points
          </span>
          <button className="btn" onClick={close}>Cancel</button>
          <button className="btn primary" onClick={save}>Apply to design</button>
        </>
      }
    >
      <div className="editor" style={{ margin: -16 }}>
        <div className="editor-canvas">
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            onWheel={onWheel}
            onPointerDown={(e) => {
              setSel(null)
              ;(e.target as Element).setPointerCapture(e.pointerId)
              pan.current = { x: e.clientX, y: e.clientY, vb }
            }}
            style={{ cursor: pan.current ? 'grabbing' : 'default' }}
          >
            {grid}
            {ref && (
              <image
                href={ref.url}
                x={ref.x - (ref.w * ref.mmPerPx) / 2}
                y={-ref.y - (ref.h * ref.mmPerPx) / 2}
                width={ref.w * ref.mmPerPx}
                height={ref.h * ref.mmPerPx}
                opacity={ref.opacity}
                transform={`rotate(${ref.rot} ${ref.x} ${-ref.y})`}
                style={{ pointerEvents: 'none' }}
              />
            )}
            {kind === 'guard' && <path d={toSvgPath(body.outline)} fill="#2a231d" stroke="#5a4c3c" strokeWidth={r} />}
            {kind !== 'head' && (
              <g opacity={0.55} style={{ pointerEvents: 'none' }}>
                <path d={`M${-neckWidthAt(d, fbEnd) / 2},${-fbEnd} L${-neckWidthAt(d, body.neckPocketY + 200) / 2},${-(body.neckPocketY + 200)} L${neckWidthAt(d, body.neckPocketY + 200) / 2},${-(body.neckPocketY + 200)} L${neckWidthAt(d, fbEnd) / 2},${-fbEnd}Z`} fill="#4a3424" stroke="#7a5a3a" strokeWidth={r} />
                {pickups.map((p) => (
                  <rect key={p.index} x={p.x - p.w / 2} y={-p.y - p.h / 2} width={p.w} height={p.h} rx={3} fill="#111" stroke="#666" strokeWidth={r} transform={`rotate(${(-p.rot * 180) / Math.PI} ${p.x} ${-p.y})`} />
                ))}
                <rect x={-40} y={-12} width={80} height={40} fill="none" stroke="#8a8a8a" strokeWidth={r} strokeDasharray={`${4 * r} ${3 * r}`} />
                <text x={44} y={4} fontSize={9 * r * 1.2} fill="#8a8a8a">bridge</text>
              </g>
            )}
            {kind === 'head' && (
              <g style={{ pointerEvents: 'none' }} opacity={0.6}>
                <rect x={-d.neck.nutWidth / 2} y={0} width={d.neck.nutWidth} height={60} fill="#4a3424" />
                <text x={d.neck.nutWidth / 2 + 4} y={6} fontSize={8 * r * 1.2} fill="#8a8a8a">nut</text>
              </g>
            )}
            <path d={toSvgPath(outline)} fill="rgba(201,160,106,0.16)" stroke="#e3a44f" strokeWidth={1.4 * r} />
            <path d={toSvgPath(outline)} fill="none" stroke="transparent" strokeWidth={10 * r} style={{ cursor: 'copy' }} onPointerDown={insertAt} />
            {st.body && (
              <g>
                <line x1={vb.x} x2={vb.x + vb.w} y1={-st.body.neckPocketY} y2={-st.body.neckPocketY} stroke="#7cc492" strokeWidth={r} strokeDasharray={`${6 * r} ${4 * r}`} />
                <rect x={-30} y={-st.body.neckPocketY - 4 * r} width={60} height={8 * r} fill="transparent" style={{ cursor: 'ns-resize' }} onPointerDown={startDrag({ kind: 'pocket' })} />
                <text x={34} y={-st.body.neckPocketY - 3 * r} fontSize={9 * r * 1.2} fill="#7cc492">neck pocket</text>
                {st.body.controls.knobs.slice(0, Math.min(4, d.electronics.volumes + d.electronics.tones)).map((k, i) => (
                  <circle key={i} cx={k.x} cy={-k.y} r={11} fill="rgba(20,20,20,0.85)" stroke="#bbb" strokeWidth={r} style={{ cursor: 'move' }} onPointerDown={startDrag({ kind: 'knob', i })} />
                ))}
                <rect x={st.body.controls.switch.x - 6} y={-st.body.controls.switch.y - 6} width={12} height={12} fill="#eee" style={{ cursor: 'move' }} onPointerDown={startDrag({ kind: 'switch' })} />
                <circle cx={st.body.controls.jack.x} cy={-st.body.controls.jack.y} r={8} fill="#999" stroke="#222" strokeWidth={r} style={{ cursor: 'move' }} onPointerDown={startDrag({ kind: 'jack' })} />
                {st.body.strapButtons.map((s, i) => (
                  <circle key={i} cx={s.x} cy={-s.y} r={5} fill="#d9b45c" style={{ cursor: 'move' }} onPointerDown={startDrag({ kind: 'strap', i })} />
                ))}
              </g>
            )}
            {st.head && st.head.tuners.mode !== 'none' && (
              <g>
                {posts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={-p.y} r={5} fill="none" stroke="#bbb" strokeWidth={r} />
                ))}
                {(['a', 'b'] as const).flatMap((line) =>
                  (line === 'a' ? [st.head!.tuners.a] : st.head!.tuners.b ? [st.head!.tuners.b] : []).flatMap((l) =>
                    ([0, 1] as const).map((end) => <rect key={line + end} x={l[end].x - 4} y={-l[end].y - 4} width={8} height={8} fill="#7cc492" style={{ cursor: 'move' }} onPointerDown={startDrag({ kind: 'tuner', line, end })} />),
                  ),
                )}
              </g>
            )}
            {st.points.map((p, i) =>
              p.corner ? (
                <rect key={i} x={p.x - 4.5 * r * 1.4} y={-p.y - 4.5 * r * 1.4} width={9 * r * 1.4} height={9 * r * 1.4} fill={p.pocket ? '#7cc492' : sel === i ? '#fff' : '#e3a44f'} stroke="#1a1714" strokeWidth={r} style={{ cursor: 'move' }} onPointerDown={startDrag({ kind: 'pt', i })} />
              ) : (
                <circle key={i} cx={p.x} cy={-p.y} r={5 * r * 1.4} fill={sel === i ? '#fff' : '#e3a44f'} stroke="#1a1714" strokeWidth={r} style={{ cursor: 'move' }} onPointerDown={startDrag({ kind: 'pt', i })} />
              ),
            )}
          </svg>
          <div className="editor-tools">
            <button className="btn small" onClick={undo} disabled={!hist.length}>Undo</button>
            <button className="btn small" onClick={toggleCorner} disabled={sel === null}>Sharp / smooth <span className="kbd">C</span></button>
            <button className="btn small" onClick={removeSel} disabled={sel === null}>Delete point <span className="kbd">Del</span></button>
            <button className="btn small" onClick={() => commit({ ...st, points: mirrorLeft(st.points) })}>Mirror left → right</button>
          </div>
        </div>
        <div className="editor-side">
          <Section title="How to edit">
            <p className="hint">Drag points to reshape. Click the outline to add a point. Select a point and press Delete to remove it or C to make it a sharp corner. Scroll to zoom, drag the background to pan. Green squares are where the neck meets the body.</p>
            {kind === 'body' && <p className="hint">Also drag the knobs, switch (square), jack, strap buttons (gold) and the dashed neck-pocket line.</p>}
            {kind === 'head' && <p className="hint">Drag the green squares to move the tuner rows.</p>}
          </Section>
          <Section title="Start from">
            <Select value={'' as string} options={[{ v: '', l: 'Load a template…' }, ...templates]} onChange={(v) => v && loadTemplate(v)} />
          </Section>
          <Section title="Symmetry">
            <Row label="Mirror edits">
              <Toggle checked={mirror} onChange={setMirror} />
            </Row>
          </Section>
          <Section title="Stretch">
            <Row label="Width %">
              <Slider value={stretch.w} min={70} max={140} step={1} onChange={(v) => setStretch((s) => ({ ...s, w: v }))} />
            </Row>
            <Row label="Length %">
              <Slider value={stretch.h} min={70} max={140} step={1} onChange={(v) => setStretch((s) => ({ ...s, h: v }))} />
            </Row>
            <button className="btn small" onClick={applyStretch} disabled={stretch.w === 100 && stretch.h === 100}>Apply stretch</button>
          </Section>
          <Section title="Trace a picture">
            <FileButton
              onFile={async (f) => {
                const url = await fileToDataUrl(f)
                const img = new Image()
                img.onload = () => {
                  const target = kind === 'head' ? 200 : 420
                  setRef({ url, w: img.naturalWidth, h: img.naturalHeight, mmPerPx: target / img.naturalHeight, x: 0, y: kind === 'head' ? 100 : (b.minY + b.maxY) / 2, rot: 0, opacity: 0.5 })
                }
                img.src = url
              }}
            >
              Load reference image…
            </FileButton>
            {ref && (
              <>
                <Row label="Opacity">
                  <Slider value={ref.opacity} min={0.05} max={1} step={0.05} onChange={(v) => setRef({ ...ref, opacity: v })} />
                </Row>
                <Row label="Height (mm)">
                  <Slider value={Math.round(ref.h * ref.mmPerPx)} min={40} max={900} step={1} onChange={(v) => setRef({ ...ref, mmPerPx: v / ref.h })} />
                </Row>
                <Row label="Move X">
                  <Slider value={ref.x} min={-300} max={300} step={1} onChange={(v) => setRef({ ...ref, x: v })} />
                </Row>
                <Row label="Move Y">
                  <Slider value={ref.y} min={-300} max={500} step={1} onChange={(v) => setRef({ ...ref, y: v })} />
                </Row>
                <Row label="Rotate">
                  <Slider value={ref.rot} min={-180} max={180} step={0.5} onChange={(v) => setRef({ ...ref, rot: v })} />
                </Row>
                <button className="btn small" onClick={() => setRef(null)}>Remove reference</button>
              </>
            )}
            <p className="hint">Use a straight-on photo or drawing; set its real height so the outline comes out at true size.</p>
          </Section>
          {sel !== null && st.points[sel] && (
            <Section title={`Point ${sel + 1}`}>
              <Row label="X (mm)">
                <input className="input" type="number" value={st.points[sel].x} onChange={(e) => commit({ ...st, points: st.points.map((p, i) => (i === sel ? { ...p, x: +e.target.value } : p)) })} disabled={!!st.points[sel].pocket} />
              </Row>
              <Row label="Y (mm)">
                <input className="input" type="number" value={st.points[sel].y} onChange={(e) => commit({ ...st, points: st.points.map((p, i) => (i === sel ? { ...p, y: +e.target.value } : p)) })} />
              </Row>
              {st.points[sel].pocket && <p className="hint">Neck-joint point: x follows the neck width automatically.</p>}
            </Section>
          )}
        </div>
      </div>
    </Modal>
  )
}
