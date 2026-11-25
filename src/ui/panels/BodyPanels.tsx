import { useState } from 'react'
import type { Finish } from '../../types'
import { useStore } from '../../store'
import { BODY_TEMPLATES, bodyTemplate } from '../../data/bodyShapes'
import { applyBodyTemplate } from '../../lib/actions'
import { ColorPick, Row, Section, Seg, Slider, Toggle, WoodPicker } from '../controls'
import { ShapeThumb } from '../ShapeThumb'
import { SourceNote } from '../SourceNote'
import { Icon } from '../icons'
import { wood } from '../../data/woods'

export function BodyPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const open = useStore((s) => s.openModal)
  const b = d.body
  return (
    <>
      <Section
        title="Body shape"
        right={
          <button className="btn small" onClick={() => open('body-editor')}>
            <Icon.edit /> Edit outline
          </button>
        }
      >
        {b.custom && (
          <div className="card on" style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <div className="thumb" style={{ height: 50, width: 60 }}>
              <ShapeThumb points={b.custom.points} height={50} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="lbl">Custom outline</div>
              <div className="sub">based on {BODY_TEMPLATES.find((t) => t.id === b.shapeId)?.name}</div>
            </div>
            <button className="btn small" onClick={() => set((x) => void (x.body.custom = null))}>
              Reset
            </button>
          </div>
        )}
        <div className="grid-cards">
          {BODY_TEMPLATES.map((t) => (
            <button key={t.id} className={'card' + (!b.custom && b.shapeId === t.id ? ' on' : '')} onClick={() => set((x) => applyBodyTemplate(x, t.id, false))}>
              <div className="thumb">
                <ShapeThumb points={t.shape.points} />
              </div>
              <div className="lbl">{t.name}</div>
            </button>
          ))}
        </div>
        <SourceNote source={bodyTemplate(b.shapeId).source} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn small" style={{ flex: 1 }} onClick={() => set((x) => applyBodyTemplate(x, b.shapeId, true))} title="Also set the scale, neck joint, headstock, bridge, pickups and controls typical for this style">
            Apply full style defaults
          </button>
        </div>
      </Section>
      <Section title="Body wood">
        <WoodPicker value={b.wood} use="body" onChange={(id) => set((x) => void (x.body.wood = id!))} />
        <p className="hint">{wood(b.wood).blurb}</p>
        <Row label="Pieces">
          <Seg value={b.pieces} options={[{ v: 1, l: '1-piece' }, { v: 2, l: '2-piece' }, { v: 3, l: '3-piece' }]} onChange={(v) => set((x) => void (x.body.pieces = v))} />
        </Row>
        <Row label="Grain">
          <button className="btn small" onClick={() => set((x) => void (x.body.seed = Math.floor(Math.random() * 10000)))}>
            <Icon.dice /> Pick another board
          </button>
        </Row>
      </Section>
      <Section title="Dimensions & edges">
        <Row label="Thickness">
          <Slider value={b.thickness} min={28} max={60} step={0.5} unit="mm" onChange={(v) => set((x) => void (x.body.thickness = v), { coalesce: 'thick' })} />
        </Row>
        <Row label="Top edge radius">
          <Slider value={b.edgeRadius} min={0.5} max={14} step={0.5} unit="mm" onChange={(v) => set((x) => void (x.body.edgeRadius = v), { coalesce: 'er' })} />
        </Row>
        <Row label="Back edge radius">
          <Slider value={b.backRadius} min={0.5} max={14} step={0.5} unit="mm" onChange={(v) => set((x) => void (x.body.backRadius = v), { coalesce: 'br' })} />
        </Row>
        <Row label="Edge bevel">
          <Slider value={b.chamfer} min={0} max={14} step={0.5} unit="mm" onChange={(v) => set((x) => void (x.body.chamfer = v), { coalesce: 'ch' })} />
        </Row>
        <Row label="Arm contour">
          <Toggle checked={b.armContour} onChange={(v) => set((x) => void (x.body.armContour = v))} />
        </Row>
        <Row label="Belly cut">
          <Toggle checked={b.bellyCut} onChange={(v) => set((x) => void (x.body.bellyCut = v))} />
        </Row>
      </Section>
      <Section title="Binding">
        <Row label="Body binding">
          <Toggle checked={b.binding.enabled} onChange={(v) => set((x) => void (x.body.binding.enabled = v))} />
        </Row>
        {b.binding.enabled && (
          <>
            <Row label="Colour">
              <ColorPick value={b.binding.color} onChange={(v) => set((x) => void (x.body.binding.color = v), { coalesce: 'bc' })} swatches={['#efe6cf', '#f7f5ef', '#111111', '#6b3a1f']} />
            </Row>
            <Row label="Width">
              <Slider value={b.binding.width} min={1} max={5} step={0.1} unit="mm" onChange={(v) => set((x) => void (x.body.binding.width = v), { coalesce: 'bw' })} />
            </Row>
          </>
        )}
      </Section>
    </>
  )
}

export function TopPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const t = d.body.top
  return (
    <>
      <Section title="Top cap">
        <Row label="Separate top">
          <Toggle checked={t.enabled} onChange={(v) => set((x) => void (x.body.top.enabled = v))} />
        </Row>
        {!t.enabled && <p className="hint">Turn on for a figured maple (or other) top glued over the body wood — drop tops, carved caps, bookmatched.</p>}
      </Section>
      {t.enabled && (
        <>
          <Section title="Top wood">
            <WoodPicker value={t.wood} use="top" onChange={(id) => set((x) => void (x.body.top.wood = id!))} />
            <p className="hint">{wood(t.wood).blurb}</p>
            <Row label="Figure strength">
              <Slider value={d.body.figure} min={0} max={1.4} step={0.05} onChange={(v) => set((x) => void (x.body.figure = v), { coalesce: 'fig' })} />
            </Row>
            <Row label="Grain">
              <button className="btn small" onClick={() => set((x) => void (x.body.seed = Math.floor(Math.random() * 10000)))}>
                <Icon.dice /> Pick another set
              </button>
            </Row>
          </Section>
          <Section title="Thickness & carve">
            <Row label="Style">
              <Seg value={t.carved ? 'carved' : 'flat'} options={[{ v: 'flat', l: 'Flat / drop top' }, { v: 'carved', l: 'Carved' }]} onChange={(v) => set((x) => {
                x.body.top.carved = v === 'carved'
                x.body.top.thickness = v === 'carved' ? Math.max(14, x.body.top.thickness) : Math.min(x.body.top.thickness, 8)
                if (v === 'carved' && x.neck.angle < 2) x.neck.angle = 3
              })} />
            </Row>
            <Row label="Top thickness">
              <Slider value={t.thickness} min={2} max={22} step={0.5} unit="mm" onChange={(v) => set((x) => void (x.body.top.thickness = v), { coalesce: 'tt' })} />
            </Row>
            {t.carved && (
              <>
                <Row label="Carve height">
                  <Slider value={t.carveHeight} min={2} max={20} step={0.5} unit="mm" onChange={(v) => set((x) => void (x.body.top.carveHeight = v), { coalesce: 'ch' })} />
                </Row>
                <Row label="Carve width">
                  <Slider value={t.carveWidth} min={12} max={90} step={1} unit="mm" onChange={(v) => set((x) => void (x.body.top.carveWidth = v), { coalesce: 'cw' })} />
                </Row>
                <Row label="Recurve dip">
                  <Slider value={t.recurve} min={0} max={1} step={0.05} onChange={(v) => set((x) => void (x.body.top.recurve = v), { coalesce: 'rc' })} />
                </Row>
              </>
            )}
            <Row label="Natural edge">
              <Toggle checked={t.naturalEdge} onChange={(v) => set((x) => void (x.body.top.naturalEdge = v))} />
            </Row>
            <p className="hint">Natural edge leaves a thin undyed band around the top (faux binding).</p>
          </Section>
        </>
      )}
    </>
  )
}

// ------------------------------------------------------------------ finishes

interface NamedFinish {
  name: string
  f: Partial<Finish>
}

export const FINISH_PRESETS: NamedFinish[] = [
  { name: 'Natural', f: { type: 'natural', amber: 0.1 } },
  { name: 'Vintage amber', f: { type: 'natural', amber: 0.5 } },
  { name: '3-tone sunburst', f: { type: 'burst', color: '#e0b04a', burstColor: '#120804', burstWidth: 60, strength: 0.7 } },
  { name: 'Cherry burst', f: { type: 'burst', color: '#e0a23a', burstColor: '#6e0d08', burstWidth: 55, strength: 0.65 } },
  { name: 'Tobacco burst', f: { type: 'burst', color: '#c9862e', burstColor: '#1a0c05', burstWidth: 50, strength: 0.7 } },
  { name: 'Ocean burst', f: { type: 'burst', color: '#1f6fb5', burstColor: '#061a33', burstWidth: 40, strength: 0.8 } },
  { name: 'Green burst', f: { type: 'burst', color: '#2f9a5a', burstColor: '#06210f', burstWidth: 40, strength: 0.8 } },
  { name: 'Purple burst', f: { type: 'burst', color: '#8a3fc2', burstColor: '#1a0629', burstWidth: 40, strength: 0.8 } },
  { name: 'Trans black', f: { type: 'stain', color: '#121212', strength: 0.92 } },
  { name: 'Trans red', f: { type: 'stain', color: '#a3130b', strength: 0.85 } },
  { name: 'Trans blue', f: { type: 'stain', color: '#1d4fa0', strength: 0.85 } },
  { name: 'Trans teal', f: { type: 'stain', color: '#138a8a', strength: 0.8 } },
  { name: 'Butterscotch', f: { type: 'stain', color: '#e0a64a', strength: 0.5, amber: 0.3 } },
  { name: 'Walnut stain', f: { type: 'stain', color: '#5a3018', strength: 0.6 } },
  { name: 'Black', f: { type: 'solid', color: '#0d0d0d' } },
  { name: 'Vintage white', f: { type: 'solid', color: '#ece5d2' } },
  { name: 'Seafoam', f: { type: 'solid', color: '#9fd8c3' } },
  { name: 'Sonic blue', f: { type: 'solid', color: '#a9cfe0' } },
  { name: 'Fiesta red', f: { type: 'solid', color: '#d43a2c' } },
  { name: 'Candy red', f: { type: 'metallic', color: '#a1060d' } },
  { name: 'Lake blue', f: { type: 'metallic', color: '#3a69ad' } },
  { name: 'Gold metallic', f: { type: 'metallic', color: '#c9a45a' } },
  { name: 'Silver sparkle', f: { type: 'metallic', color: '#9ea3a8' } },
]

function presetSwatch(f: Partial<Finish>) {
  if (f.type === 'burst') return `radial-gradient(circle at 50% 45%, ${f.color} 35%, ${f.burstColor} 95%)`
  if (f.type === 'natural') return f.amber && f.amber > 0.3 ? '#d9a65f' : '#ecd2a0'
  if (f.type === 'metallic') return `linear-gradient(135deg, ${f.color}, #ffffff66 50%, ${f.color})`
  return f.color!
}

export function FinishEditor({ f, onChange, coalesce }: { f: Finish; onChange: (fn: (f: Finish) => void, c?: string) => void; coalesce: string }) {
  return (
    <>
      <div className="color" style={{ margin: '4px 0 10px' }}>
        {FINISH_PRESETS.map((p) => (
          <span
            key={p.name}
            className="swatch"
            title={p.name}
            style={{ background: presetSwatch(p.f), width: 26, height: 26 }}
            onClick={() => onChange((x) => Object.assign(x, { ...p.f, amber: p.f.amber ?? 0.1 }))}
          />
        ))}
      </div>
      <Row label="Finish type">
        <Seg value={f.type} options={[{ v: 'natural', l: 'Clear' }, { v: 'stain', l: 'Dye' }, { v: 'burst', l: 'Burst' }, { v: 'solid', l: 'Solid' }, { v: 'metallic', l: 'Metal' }]} onChange={(v) => onChange((x) => void (x.type = v))} />
      </Row>
      <Row label="Sheen">
        <Seg value={f.sheen} options={[{ v: 'gloss', l: 'Gloss' }, { v: 'satin', l: 'Satin' }, { v: 'oil', l: 'Oil / raw' }]} onChange={(v) => onChange((x) => void (x.sheen = v))} />
      </Row>
      {f.type !== 'natural' && (
        <Row label={f.type === 'solid' || f.type === 'metallic' ? 'Paint colour' : 'Dye colour'}>
          <ColorPick value={f.color} onChange={(v) => onChange((x) => void (x.color = v), coalesce + 'c')} />
        </Row>
      )}
      {(f.type === 'stain' || f.type === 'burst') && (
        <Row label="Dye strength">
          <Slider value={f.strength} min={0.05} max={1} step={0.05} onChange={(v) => onChange((x) => void (x.strength = v), coalesce + 's')} />
        </Row>
      )}
      {f.type === 'burst' && (
        <>
          <Row label="Burst colour">
            <ColorPick value={f.burstColor} onChange={(v) => onChange((x) => void (x.burstColor = v), coalesce + 'bc')} swatches={['#120804', '#3a1a08', '#6e0d08', '#061a33', '#000000']} />
          </Row>
          <Row label="Burst width">
            <Slider value={f.burstWidth} min={8} max={120} step={1} unit="mm" onChange={(v) => onChange((x) => void (x.burstWidth = v), coalesce + 'bw')} />
          </Row>
        </>
      )}
      {f.type !== 'solid' && f.type !== 'metallic' && (
        <Row label="Amber tint">
          <Slider value={f.amber} min={0} max={1} step={0.05} onChange={(v) => onChange((x) => void (x.amber = v), coalesce + 'a')} />
        </Row>
      )}
    </>
  )
}

type Zone = 'top' | 'body' | 'neck' | 'head'

export function FinishPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const [zone, setZone] = useState<Zone>(d.body.top.enabled ? 'top' : 'body')
  const edit = (z: Zone) => (fn: (f: Finish) => void, c?: string) => set((x) => fn(x.finish[z]), c ? { coalesce: c } : undefined)
  const zones: { v: Zone; l: string }[] = [
    { v: 'top', l: d.body.top.enabled ? 'Top' : 'Top*' },
    { v: 'body', l: 'Back & sides' },
    { v: 'neck', l: 'Neck' },
    { v: 'head', l: 'Headstock' },
  ]
  return (
    <>
      <Section title="Surface">
        <Seg value={zone} options={zones} onChange={setZone} />
      </Section>
      <Section title={zone === 'top' ? 'Top finish' : zone === 'body' ? 'Back & sides finish' : zone === 'neck' ? 'Neck finish' : 'Headstock face'}>
        {zone === 'top' && !d.body.top.enabled && (
          <>
            <p className="hint">No separate top: the face of the body uses the back &amp; sides finish. Add a top in the Top tab to finish it separately.</p>
            <FinishEditor f={d.finish.body} onChange={edit('body')} coalesce="fb" />
          </>
        )}
        {zone === 'top' && d.body.top.enabled && <FinishEditor f={d.finish.top} onChange={edit('top')} coalesce="ft" />}
        {zone === 'body' && <FinishEditor f={d.finish.body} onChange={edit('body')} coalesce="fb" />}
        {zone === 'neck' && (
          <>
            <FinishEditor f={d.finish.neck} onChange={edit('neck')} coalesce="fn" />
            <Row label="Fretboard">
              <Seg value={d.finish.fretboard} options={[{ v: 'oil', l: 'Oiled (rosewood/ebony)' }, { v: 'clear', l: 'Lacquered (maple)' }]} onChange={(v) => set((x) => void (x.finish.fretboard = v))} />
            </Row>
          </>
        )}
        {zone === 'head' && (
          <>
            <Row label="Face finish">
              <Seg value={d.headstock.faceFinish} options={[{ v: 'match-body', l: 'Body' }, { v: 'match-top', l: 'Top' }, { v: 'match-neck', l: 'Neck' }, { v: 'own', l: 'Own' }]} onChange={(v) => set((x) => void (x.headstock.faceFinish = v))} />
            </Row>
            {d.headstock.faceFinish === 'own' ? <FinishEditor f={d.finish.head} onChange={edit('head')} coalesce="fh" /> : <p className="hint">Matching headstock: uses the {d.headstock.faceFinish.replace('match-', '')} finish{d.headstock.faceFinish === 'match-top' ? ' and top wood' : ''}.</p>}
          </>
        )}
      </Section>
    </>
  )
}
