import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { PLANS, PLAN_CATEGORIES, PLAN_KINDS, planSizeMm, planThumb, planUrl, plansForEditor, type Plan, type PlanCategory, type PlanKind } from '../data/plans'
import { formatBytes, loadPlanImage, type PlanImage } from '../lib/plans'
import { Modal } from './controls'
import { Icon } from './icons'

const catLabel = (c: PlanCategory) => PLAN_CATEGORIES.find((x) => x.id === c)!.label
const kindLabel = (k: PlanKind) => PLAN_KINDS.find((x) => x.id === k)!.one
const mm = (v: number) => (v >= 20 ? v.toFixed(0) : v.toFixed(1))
const sizeText = (p: Plan) => {
  const s = planSizeMm(p)
  return `${mm(s.w)} × ${mm(s.h)} mm`
}

export function PlansModal() {
  const close = () => useStore.getState().openModal(null)
  const [cat, setCat] = useState<PlanCategory | 'all'>('all')
  const [kind, setKind] = useState<PlanKind | 'all'>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(() => {
    const id = useStore.getState().plansOpenId
    if (id) useStore.setState({ plansOpenId: null })
    return id
  })

  const inCat = PLANS.filter((p) => cat === 'all' || p.category === cat)
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const list = inCat.filter((p) => (kind === 'all' || p.kind === kind) && words.every((w) => `${p.title} ${p.blurb} ${catLabel(p.category)}`.toLowerCase().includes(w)))
  const open = openId ? PLANS.find((p) => p.id === openId) : undefined

  return (
    <Modal
      title={open ? open.title : `Plans (${PLANS.length})`}
      onClose={close}
      actions={open && <button className="btn small" onClick={() => setOpenId(null)}>← All plans</button>}
    >
      {open ? (
        <PlanDetail plan={open} />
      ) : (
        <>
          <div className="plans-filters">
            <input className="input" placeholder="Search plans…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
            <div className="chips">
              <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>All styles</button>
              {PLAN_CATEGORIES.map((c) => (
                <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>
                  {c.label} <span className="count">{PLANS.filter((p) => p.category === c.id).length}</span>
                </button>
              ))}
            </div>
            <div className="chips">
              <button className={'chip' + (kind === 'all' ? ' on' : '')} onClick={() => setKind('all')}>Everything</button>
              {PLAN_KINDS.map((k) => {
                const n = inCat.filter((p) => p.kind === k.id).length
                return n ? (
                  <button key={k.id} className={'chip' + (kind === k.id ? ' on' : '')} onClick={() => setKind(k.id)}>
                    {k.label} <span className="count">{n}</span>
                  </button>
                ) : null
              })}
            </div>
          </div>
          {!list.length && <div className="empty">No plans match.</div>}
          <div className="plan-grid">
            {list.map((p) => (
              <button key={p.id} className="card plan-card" onClick={() => setOpenId(p.id)}>
                <div className="paper">
                  <img src={planThumb(p)} alt="" loading="lazy" />
                </div>
                <div className="lbl">{p.title}</div>
                <div className="sub">
                  {catLabel(p.category)} · {kindLabel(p.kind)} · {sizeText(p)}
                </div>
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            Every plan is a full-size SVG at true scale. Open one to zoom in, download the original file, or trace over it in the outline editor.
          </p>
        </>
      )}
    </Modal>
  )
}

function PlanDetail({ plan }: { plan: Plan }) {
  const trace = useStore((s) => s.traceWithPlan)
  const s = planSizeMm(plan)
  const canBody = plansForEditor('body').includes(plan)
  const canHead = plansForEditor('head').includes(plan)
  return (
    <div className="plan-detail">
      <PlanViewer plan={plan} />
      <div className="plan-side">
        <p style={{ marginTop: 0 }}>{plan.blurb}</p>
        <dl className="plan-facts">
          <dt>Style</dt>
          <dd>{catLabel(plan.category)}</dd>
          <dt>Type</dt>
          <dd>{kindLabel(plan.kind)}</dd>
          <dt>Drawing</dt>
          <dd>
            {mm(s.w)} × {mm(s.h)} mm
            <br />
            <span className="sub">
              {(s.w / 25.4).toFixed(2)}" × {(s.h / 25.4).toFixed(2)}"
            </span>
          </dd>
          <dt>File</dt>
          <dd>SVG · {formatBytes(plan.bytes)}</dd>
        </dl>
        <div className="section">
          <h3>Use it</h3>
          <div className="plan-actions">
            {canBody && (
              <button className="btn primary" onClick={() => trace({ planId: plan.id, editor: 'body' })}>
                <Icon.edit /> Trace as body outline
              </button>
            )}
            {canBody && plan.kind === 'body' && (
              <button className="btn" onClick={() => trace({ planId: plan.id, editor: 'guard' })}>
                Trace a pickguard on it
              </button>
            )}
            {canHead && (
              <button className="btn primary" onClick={() => trace({ planId: plan.id, editor: 'head' })}>
                <Icon.edit /> Trace as headstock
              </button>
            )}
            <a className="btn" href={planUrl(plan)} download={`${plan.id}.svg`}>
              <Icon.save /> Download SVG
            </a>
          </div>
          <p className="hint">The download is the original file, unchanged and at true scale, ready for a laser, CNC or printer.</p>
          {(canBody || canHead) && <p className="hint">Tracing opens the outline editor with this plan behind it at 1:1, so the outline you draw comes out at real size.</p>}
        </div>
      </div>
    </div>
  )
}

const NICE = [5, 10, 20, 50, 100, 200, 500, 1000]

/** Zoomable, pannable view of a plan in millimetres, with a scale bar. */
function PlanViewer({ plan }: { plan: Plan }) {
  const [img, setImg] = useState<PlanImage | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const k = plan.mmPerUnit
  const box = img?.box ?? plan.box
  const W = box[2] * k
  const H = box[3] * k
  const fit = useMemo(() => ({ x: -W * 0.04, y: -H * 0.04, w: W * 1.08, h: H * 1.08 }), [W, H])
  const [vb, setVb] = useState(fit)
  const pan = useRef<{ x: number; y: number; vb: typeof vb } | null>(null)

  useEffect(() => {
    let live = true
    setImg(null)
    setErr(null)
    loadPlanImage(plan).then(
      (i) => live && setImg(i),
      (e: Error) => live && setErr(e.message),
    )
    return () => {
      live = false
    }
  }, [plan])
  useEffect(() => setVb(fit), [fit])

  // the svg letterboxes the viewBox; work out mm per screen pixel along the limiting axis
  const pxScale = () => {
    const r = svgRef.current!.getBoundingClientRect()
    return Math.max(vb.w / r.width, vb.h / r.height)
  }
  const toMm = (e: { clientX: number; clientY: number }) => {
    const pt = svgRef.current!.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    return pt.matrixTransform(svgRef.current!.getScreenCTM()!.inverse())
  }
  const zoom = (f: number, at?: { x: number; y: number }) =>
    setVb((v) => {
      const c = at ?? { x: v.x + v.w / 2, y: v.y + v.h / 2 }
      return { x: c.x - (c.x - v.x) * f, y: c.y - (c.y - v.y) * f, w: v.w * f, h: v.h * f }
    })

  // scale bar about a sixth of the view wide
  const bar = NICE.reduce((b, n) => (n <= vb.w / 6 ? n : b), NICE[0])
  const u = vb.w / 900

  return (
    <div className="plan-view">
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        onWheel={(e) => zoom(Math.exp(e.deltaY * 0.0015), toMm(e))}
        onPointerDown={(e) => {
          ;(e.target as Element).setPointerCapture(e.pointerId)
          pan.current = { x: e.clientX, y: e.clientY, vb }
        }}
        onPointerMove={(e) => {
          const p = pan.current
          if (!p) return
          const s = pxScale()
          setVb({ ...p.vb, x: p.vb.x - (e.clientX - p.x) * s, y: p.vb.y - (e.clientY - p.y) * s })
        }}
        onPointerUp={() => (pan.current = null)}
        onPointerLeave={() => (pan.current = null)}
      >
        {img && <image href={img.url} x={0} y={0} width={W} height={H} />}
        <g transform={`translate(${vb.x + vb.w * 0.03} ${vb.y + vb.h * 0.95})`} style={{ pointerEvents: 'none' }}>
          <rect x={-6 * u} y={-26 * u} width={bar + 12 * u} height={34 * u} rx={4 * u} fill="rgba(255,255,255,0.85)" />
          <path d={`M0 0h${bar}M0 ${-6 * u}v${12 * u}M${bar} ${-6 * u}v${12 * u}`} stroke="#c0392b" strokeWidth={2 * u} />
          <text x={bar / 2} y={-11 * u} fontSize={12 * u} textAnchor="middle" fill="#7a2418">
            {bar >= 1000 ? `${bar / 1000} m` : `${bar} mm`}
          </text>
        </g>
      </svg>
      {!img && !err && <div className="plan-loading">Loading {formatBytes(plan.bytes)}…</div>}
      {err && <div className="plan-loading">{err}</div>}
      <div className="plan-zoom">
        <button className="btn small" onClick={() => zoom(1 / 1.4)}>+</button>
        <button className="btn small" onClick={() => zoom(1.4)}>−</button>
        <button className="btn small" onClick={() => setVb(fit)}>Fit</button>
      </div>
    </div>
  )
}
