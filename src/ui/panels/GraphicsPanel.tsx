import { useEffect, useMemo, useRef, useState } from 'react'
import type { Decal, DecalZone, Design, Vec2 } from '../../types'
import { useStore } from '../../store'
import { getLoadedImage, loadImage, onImagesChanged, putImage, sampleArt } from '../../lib/imageStore'
import { processDecal } from '../../lib/bake'
import { bounds, ensureCCW, sampleOutline, uid } from '../../lib/geometry'
import { pickguardPoints, resolveBody, resolveHeadstock } from '../../lib/layout'
import { ColorPick, FileButton, Row, Section, Seg, Select, Slider, Toggle } from '../controls'
import { Icon } from '../icons'

const ZONE_LABEL: Record<DecalZone, string> = { top: 'Body front', back: 'Body back', headstock: 'Headstock', pickguard: 'Pickguard' }

function zoneOutline(d: Design, z: DecalZone): Vec2[] {
  if (z === 'headstock') return resolveHeadstock(d).outline
  if (z === 'pickguard') {
    const p = pickguardPoints(d)
    return p ? ensureCCW(sampleOutline(p, 3)) : resolveBody(d).outline
  }
  const o = resolveBody(d).outline
  return z === 'back' ? o.map((p) => ({ x: -p.x, y: p.y })) : o
}

function defaultsFor(z: DecalZone, d: Design): Pick<Decal, 'x' | 'y' | 'width'> {
  if (z === 'headstock') {
    const b = resolveHeadstock(d).bounds
    return { x: (b.minX + b.maxX) / 2, y: b.minY + b.h * 0.6, width: Math.min(46, b.w * 0.7) }
  }
  if (z === 'pickguard') return { x: 60, y: 120, width: 50 }
  const b = resolveBody(d).bounds
  return { x: 0, y: (b.minY + b.maxY) / 2 - 30, width: b.w * 0.45 }
}

export function newDecal(imageId: string, name: string, zone: DecalZone, d: Design): Decal {
  return {
    id: uid('decal'),
    imageId,
    name,
    zone,
    visible: true,
    ...defaultsFor(zone, d),
    rotation: 0,
    flipX: false,
    opacity: 1,
    blend: 'source-over',
    crop: { x: 0, y: 0, w: 1, h: 1 },
    mask: 'none',
    removeWhite: 0,
    hue: 0,
    saturation: 1,
    brightness: 1,
    contrast: 1,
    grayscale: false,
    invert: false,
    material: 'image',
    color: '#f2ead8',
    tintAmount: 0,
  }
}

/** Interactive 2D placement: drag to move, corner to scale, top handle to rotate. */
function Placer({ d, zone, selected, onChange, onSelect }: { d: Design; zone: DecalZone; selected: Decal | null; onChange: (fn: (x: Decal) => void) => void; onSelect: (id: string) => void }) {
  const outline = useMemo(() => zoneOutline(d, zone), [d, zone])
  const b = bounds(outline)
  const pad = Math.max(b.w, b.h) * 0.06
  const W = 300
  const scale = W / (b.w + pad * 2)
  const H = Math.round((b.h + pad * 2) * scale)
  const toPx = (p: Vec2) => ({ x: (p.x - b.minX + pad) * scale, y: (b.maxY + pad - p.y) * scale })
  const toMm = (x: number, y: number) => ({ x: x / scale + b.minX - pad, y: b.maxY + pad - y / scale })
  const canvas = useRef<HTMLCanvasElement>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const off = onImagesChanged(() => setTick((t) => t + 1))
    return () => {
      off()
    }
  }, [])
  const list = d.decals.filter((x) => x.zone === zone)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = W * dpr
    c.height = H * dpr
    const g = c.getContext('2d')!
    g.scale(dpr, dpr)
    g.clearRect(0, 0, W, H)
    const path = new Path2D()
    outline.forEach((p, i) => {
      const q = toPx(p)
      if (i) path.lineTo(q.x, q.y)
      else path.moveTo(q.x, q.y)
    })
    path.closePath()
    g.fillStyle = '#5a4a3a'
    g.fill(path)
    g.save()
    g.clip(path)
    for (const dc of list) {
      if (!dc.visible) continue
      const im = processDecal(dc)
      if (!im) continue
      const w = dc.width * scale
      const h = (w * im.height) / im.width
      const c0 = toPx(dc)
      g.save()
      g.globalAlpha = dc.opacity
      g.globalCompositeOperation = dc.blend
      g.translate(c0.x, c0.y)
      g.rotate((-dc.rotation * Math.PI) / 180)
      g.scale(dc.flipX ? -1 : 1, 1)
      g.drawImage(im, -w / 2, -h / 2, w, h)
      g.restore()
    }
    g.restore()
    g.strokeStyle = '#c9a06a'
    g.lineWidth = 1.2
    g.stroke(path)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outline, list, tick, W, H])

  const sel = selected && selected.zone === zone ? selected : null
  const im = sel ? processDecal(sel) : null
  const aspect = im ? im.height / im.width : 1
  const drag = useRef<{ mode: 'move' | 'scale' | 'rotate'; start: Vec2; orig: Decal } | null>(null)

  const onDown = (mode: 'move' | 'scale' | 'rotate') => (e: React.PointerEvent) => {
    if (!sel) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const r = (e.currentTarget as Element).closest('.placer')!.getBoundingClientRect()
    drag.current = { mode, start: toMm(e.clientX - r.left, e.clientY - r.top), orig: { ...sel } }
  }
  const onMove = (e: React.PointerEvent) => {
    const dr = drag.current
    if (!dr) return
    const r = (e.currentTarget as Element).getBoundingClientRect()
    const p = toMm(e.clientX - r.left, e.clientY - r.top)
    if (dr.mode === 'move') onChange((x) => {
      x.x = Math.round((dr.orig.x + p.x - dr.start.x) * 10) / 10
      x.y = Math.round((dr.orig.y + p.y - dr.start.y) * 10) / 10
    })
    else if (dr.mode === 'scale') {
      const d0 = Math.hypot(dr.start.x - dr.orig.x, dr.start.y - dr.orig.y)
      const d1 = Math.hypot(p.x - dr.orig.x, p.y - dr.orig.y)
      onChange((x) => void (x.width = Math.max(4, Math.round(dr.orig.width * (d1 / Math.max(1, d0)) * 10) / 10)))
    } else {
      const a = (Math.atan2(p.y - dr.orig.y, p.x - dr.orig.x) * 180) / Math.PI - 90
      onChange((x) => void (x.rotation = Math.round(a)))
    }
  }
  const onUp = () => (drag.current = null)

  let handles = null
  if (sel) {
    const c0 = toPx(sel)
    const w = sel.width * scale
    const h = w * aspect
    handles = (
      <g transform={`translate(${c0.x} ${c0.y}) rotate(${-sel.rotation})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="rgba(227,164,79,0.06)" stroke="#e3a44f" strokeDasharray="4 3" style={{ cursor: 'move' }} onPointerDown={onDown('move')} />
        <line x1={0} y1={-h / 2} x2={0} y2={-h / 2 - 18} stroke="#e3a44f" />
        <circle cx={0} cy={-h / 2 - 20} r={6} fill="#1a1714" stroke="#e3a44f" strokeWidth={1.5} style={{ cursor: 'grab' }} onPointerDown={onDown('rotate')} />
        <rect x={w / 2 - 6} y={h / 2 - 6} width={12} height={12} fill="#e3a44f" style={{ cursor: 'nwse-resize' }} onPointerDown={onDown('scale')} />
      </g>
    )
  }
  return (
    <div className="placer" style={{ height: H }} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      <canvas ref={canvas} style={{ width: W, height: H }} />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        onPointerDown={(e) => {
          const r = (e.currentTarget as Element).getBoundingClientRect()
          const p = toMm(e.clientX - r.left, e.clientY - r.top)
          const hit = [...list].reverse().find((dc) => Math.hypot(dc.x - p.x, dc.y - p.y) < dc.width / 2)
          if (hit) onSelect(hit.id)
        }}
      >
        {handles}
      </svg>
    </div>
  )
}

export function GraphicsPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const selId = useStore((s) => s.selectedDecal)
  const select = useStore((s) => s.selectDecal)
  const [zone, setZone] = useState<DecalZone>('top')
  const sel = d.decals.find((x) => x.id === selId) ?? null
  useEffect(() => {
    if (sel && sel.zone !== zone) setZone(sel.zone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId])
  useEffect(() => {
    d.decals.forEach((x) => loadImage(x.imageId))
  }, [d.decals])
  const [, force] = useState(0)
  useEffect(() => {
    const off = onImagesChanged(() => force((t) => t + 1))
    return () => {
      off()
    }
  }, [])

  const add = async (src: Blob | string, name: string, material: Decal['material'] = 'image') => {
    const id = await putImage(src)
    const dc = newDecal(id, name, zone, useStore.getState().design)
    dc.material = material
    set((x) => void x.decals.push(dc))
    select(dc.id)
  }
  const edit = (fn: (x: Decal) => void, c?: string) =>
    set(
      (x) => {
        const t = x.decals.find((y) => y.id === selId)
        if (t) fn(t)
      },
      c ? { coalesce: c + selId } : undefined,
    )
  const zones: DecalZone[] = d.pickguard.enabled ? ['top', 'back', 'headstock', 'pickguard'] : ['top', 'back', 'headstock']

  return (
    <>
      <Section title="Where">
        <Seg value={zone} options={zones.map((z) => ({ v: z, l: ZONE_LABEL[z] }))} onChange={(z) => {
          setZone(z)
          select(d.decals.find((x) => x.zone === z)?.id ?? null)
        }} />
      </Section>
      <Section title="Add artwork">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FileButton className="btn small primary" onFile={(f) => add(f, f.name.replace(/\.[^.]+$/, ''))}>
            <Icon.plus /> Upload image
          </FileButton>
          <button className="btn small" onClick={() => add(sampleArt('logo'), 'Logo', zone === 'headstock' ? 'gold-leaf' : 'image')}>Sample logo</button>
          <button className="btn small" onClick={() => add(sampleArt('flames'), 'Flames')}>Flames</button>
          <button className="btn small" onClick={() => add(sampleArt('stars'), 'Stars')}>Stars</button>
        </div>
        <p className="hint">PNG with transparency works best for logos. JPGs on white: use "Remove white".</p>
      </Section>
      <Section title={`Layers on ${ZONE_LABEL[zone].toLowerCase()}`}>
        <div className="decal-list">
          {d.decals.filter((x) => x.zone === zone).length === 0 && <div className="empty">No graphics here yet.</div>}
          {d.decals
            .filter((x) => x.zone === zone)
            .map((x) => (
              <div key={x.id} className={'decal-item' + (x.id === selId ? ' on' : '')} onClick={() => select(x.id)}>
                <img src={getLoadedImage(x.imageId)?.src} alt="" />
                <span className="nm">{x.name}</span>
                <button className="btn ghost icon small" title={x.visible ? 'Hide' : 'Show'} onClick={(e) => {
                  e.stopPropagation()
                  set((y) => {
                    const t = y.decals.find((z) => z.id === x.id)!
                    t.visible = !t.visible
                  })
                }} style={{ opacity: x.visible ? 1 : 0.4 }}>
                  <Icon.eye />
                </button>
              </div>
            ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <Placer d={d} zone={zone} selected={sel} onChange={(fn) => edit(fn, 'drag')} onSelect={select} />
        </div>
        <p className="hint">Drag to move · square handle to scale · round handle to rotate. Anything past the edge is cut off.</p>
      </Section>
      {sel && (
        <>
          <Section
            title="Placement"
            right={
              <span style={{ display: 'flex', gap: 4 }}>
                <button className="btn small icon" title="Duplicate" onClick={() => set((x) => {
                  const c = { ...structuredClone(sel), id: uid('decal'), x: sel.x + 10, y: sel.y - 10, name: sel.name + ' copy' }
                  x.decals.push(c)
                  setTimeout(() => select(c.id))
                })}>
                  <Icon.copy />
                </button>
                <button className="btn small icon danger" title="Delete" onClick={() => {
                  set((x) => void (x.decals = x.decals.filter((y) => y.id !== sel.id)))
                  select(null)
                }}>
                  <Icon.trash />
                </button>
              </span>
            }
          >
            <Row label="Name">
              <input className="input" value={sel.name} onChange={(e) => edit((x) => void (x.name = e.target.value), 'name')} />
            </Row>
            <Row label="Surface">
              <Select value={sel.zone} options={zones.map((z) => ({ v: z, l: ZONE_LABEL[z] }))} onChange={(z) => edit((x) => Object.assign(x, { zone: z, ...defaultsFor(z, useStore.getState().design) }))} />
            </Row>
            <Row label="X">
              <Slider value={sel.x} min={-260} max={260} step={0.5} unit="mm" onChange={(v) => edit((x) => void (x.x = v), 'x')} />
            </Row>
            <Row label="Y">
              <Slider value={sel.y} min={-340} max={400} step={0.5} unit="mm" onChange={(v) => edit((x) => void (x.y = v), 'y')} />
            </Row>
            <Row label="Width">
              <Slider value={sel.width} min={4} max={600} step={0.5} unit="mm" onChange={(v) => edit((x) => void (x.width = v), 'w')} />
            </Row>
            <Row label="Rotation">
              <Slider value={sel.rotation} min={-180} max={180} step={1} unit="°" onChange={(v) => edit((x) => void (x.rotation = v), 'r')} />
            </Row>
            <Row label="Mirror">
              <Toggle checked={sel.flipX} onChange={(v) => edit((x) => void (x.flipX = v))} />
            </Row>
            <Row label="Layer order">
              <span style={{ display: 'flex', gap: 4 }}>
                <button className="btn small" onClick={() => set((x) => {
                  const i = x.decals.findIndex((y) => y.id === sel.id)
                  const [it] = x.decals.splice(i, 1)
                  x.decals.push(it)
                })}>Bring to front</button>
                <button className="btn small" onClick={() => set((x) => {
                  const i = x.decals.findIndex((y) => y.id === sel.id)
                  const [it] = x.decals.splice(i, 1)
                  x.decals.unshift(it)
                })}>Send to back</button>
              </span>
            </Row>
          </Section>
          <Section title="Crop & mask">
            <Row label="Crop left">
              <Slider value={sel.crop.x} min={0} max={0.95} step={0.01} onChange={(v) => edit((x) => {
                const right = x.crop.x + x.crop.w
                x.crop.x = Math.min(v, right - 0.02)
                x.crop.w = right - x.crop.x
              }, 'cl')} />
            </Row>
            <Row label="Crop right">
              <Slider value={1 - (sel.crop.x + sel.crop.w)} min={0} max={0.95} step={0.01} onChange={(v) => edit((x) => void (x.crop.w = Math.max(0.02, 1 - v - x.crop.x)), 'cr')} />
            </Row>
            <Row label="Crop top">
              <Slider value={sel.crop.y} min={0} max={0.95} step={0.01} onChange={(v) => edit((x) => {
                const bottom = x.crop.y + x.crop.h
                x.crop.y = Math.min(v, bottom - 0.02)
                x.crop.h = bottom - x.crop.y
              }, 'ct')} />
            </Row>
            <Row label="Crop bottom">
              <Slider value={1 - (sel.crop.y + sel.crop.h)} min={0} max={0.95} step={0.01} onChange={(v) => edit((x) => void (x.crop.h = Math.max(0.02, 1 - v - x.crop.y)), 'cb')} />
            </Row>
            <Row label="Shape">
              <Seg value={sel.mask} options={[{ v: 'none', l: 'As is' }, { v: 'circle', l: 'Oval' }, { v: 'rounded', l: 'Rounded' }]} onChange={(v) => edit((x) => void (x.mask = v))} />
            </Row>
            <Row label="Remove white">
              <Slider value={sel.removeWhite} min={0} max={1} step={0.02} onChange={(v) => edit((x) => void (x.removeWhite = v), 'rw')} />
            </Row>
          </Section>
          <Section title="Colour">
            <Row label="Render as">
              <Select value={sel.material} options={[{ v: 'image', l: 'Picture (full colour)' }, { v: 'color', l: 'Solid colour silhouette' }, { v: 'mop', l: 'Pearl inlay' }, { v: 'abalone', l: 'Abalone inlay' }, { v: 'gold-leaf', l: 'Gold leaf' }, { v: 'chrome', l: 'Chrome / silver' }]} onChange={(v) => edit((x) => void (x.material = v))} />
            </Row>
            {(sel.material === 'color' || sel.material === 'image') && (
              <Row label={sel.material === 'color' ? 'Colour' : 'Tint colour'}>
                <ColorPick value={sel.color} onChange={(v) => edit((x) => void (x.color = v), 'c')} swatches={['#ffffff', '#111111', '#d4af37', '#c0392b', '#2e86de', '#27ae60']} />
              </Row>
            )}
            {sel.material === 'image' && (
              <>
                <Row label="Tint amount">
                  <Slider value={sel.tintAmount} min={0} max={1} step={0.02} onChange={(v) => edit((x) => void (x.tintAmount = v), 'ta')} />
                </Row>
                <Row label="Hue shift">
                  <Slider value={sel.hue} min={-180} max={180} step={1} unit="°" onChange={(v) => edit((x) => void (x.hue = v), 'h')} />
                </Row>
                <Row label="Saturation">
                  <Slider value={sel.saturation} min={0} max={3} step={0.05} onChange={(v) => edit((x) => void (x.saturation = v), 's')} />
                </Row>
                <Row label="Brightness">
                  <Slider value={sel.brightness} min={0.2} max={2} step={0.05} onChange={(v) => edit((x) => void (x.brightness = v), 'b')} />
                </Row>
                <Row label="Contrast">
                  <Slider value={sel.contrast} min={0.2} max={3} step={0.05} onChange={(v) => edit((x) => void (x.contrast = v), 'ct2')} />
                </Row>
                <Row label="Black & white">
                  <Toggle checked={sel.grayscale} onChange={(v) => edit((x) => void (x.grayscale = v))} />
                </Row>
                <Row label="Invert">
                  <Toggle checked={sel.invert} onChange={(v) => edit((x) => void (x.invert = v))} />
                </Row>
              </>
            )}
            <Row label="Opacity">
              <Slider value={sel.opacity} min={0.05} max={1} step={0.05} onChange={(v) => edit((x) => void (x.opacity = v), 'o')} />
            </Row>
            <Row label="Blend">
              <Select value={sel.blend} options={[{ v: 'source-over', l: 'Normal' }, { v: 'multiply', l: 'Multiply (lets grain through)' }, { v: 'overlay', l: 'Overlay' }, { v: 'soft-light', l: 'Soft light' }, { v: 'screen', l: 'Screen' }]} onChange={(v) => edit((x) => void (x.blend = v))} />
            </Row>
          </Section>
        </>
      )}
    </>
  )
}
