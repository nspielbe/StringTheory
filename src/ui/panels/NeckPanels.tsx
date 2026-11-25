import type { InlayMaterial, InlayPattern } from '../../types'
import { useStore } from '../../store'
import { HEADSTOCK_TEMPLATES, headstockTemplate } from '../../data/headstockShapes'
import { tunersFor } from '../../data/catalog'
import { setHeadstock, setStrings } from '../../lib/actions'
import { ColorPick, FileButton, ProductPicker, Row, Section, Seg, Select, Slider, Toggle, WoodPicker } from '../controls'
import { ShapeThumb } from '../ShapeThumb'
import { SourceNote } from '../SourceNote'
import { Icon } from '../icons'
import { INLAY_LABEL, inlaySwatch } from '../../lib/patterns'
import { putImage, sampleArt, getLoadedImage } from '../../lib/imageStore'
import { useEffect, useState, type ReactElement } from 'react'

const SCALES = [
  { v: 610, l: '24"' },
  { v: 628, l: '24.75"' },
  { v: 635, l: '25"' },
  { v: 648, l: '25.5"' },
  { v: 673, l: '26.5"' },
  { v: 686, l: '27" bari' },
]

export function NeckPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const n = d.neck
  return (
    <>
      <Section title="Scale & strings">
        <Row label="Strings">
          <Seg value={d.strings} options={[{ v: 6, l: '6-string' }, { v: 7, l: '7-string' }]} onChange={(v) => set((x) => setStrings(x, v))} />
        </Row>
        <Row label="Scale length">
          <Seg value={SCALES.some((s) => s.v === d.scale) ? d.scale : 0} options={SCALES} onChange={(v) => set((x) => void (x.scale = v))} />
        </Row>
        <Row label="Custom scale">
          <Slider value={d.scale} min={580} max={700} step={1} unit="mm" onChange={(v) => set((x) => void (x.scale = v), { coalesce: 'scale' })} />
        </Row>
        <p className="hint">{(d.scale / 25.4).toFixed(2)}" · the body stays put; the neck joint shifts with the scale.</p>
        <Row label="Frets">
          <Seg value={d.frets} options={[{ v: 21, l: '21' }, { v: 22, l: '22' }, { v: 24, l: '24' }]} onChange={(v) => set((x) => void (x.frets = v))} />
        </Row>
        <Row label="Left-handed">
          <Toggle checked={d.leftHanded} onChange={(v) => set((x) => void (x.leftHanded = v))} />
        </Row>
      </Section>
      <Section title="Construction">
        <Row label="Neck joint">
          <Seg value={n.construction} options={[{ v: 'bolt-on', l: 'Bolt-on' }, { v: 'set', l: 'Set (glued)' }, { v: 'neck-through', l: 'Neck-through' }]} onChange={(v) => set((x) => void (x.neck.construction = v))} />
        </Row>
        <Row label="Neck angle">
          <Slider value={n.angle} min={0} max={6} step={0.25} unit="°" onChange={(v) => set((x) => void (x.neck.angle = v), { coalesce: 'na' })} />
        </Row>
      </Section>
      <Section title="Neck wood">
        <WoodPicker value={n.wood} use="neck" onChange={(id) => set((x) => void (x.neck.wood = id!))} />
      </Section>
      <Section title="Carve">
        <Row label="Profile">
          <Seg value={n.profile} options={[{ v: 'C', l: 'C' }, { v: 'D', l: 'D' }, { v: 'thinD', l: 'Thin D' }, { v: 'U', l: 'U' }, { v: 'V', l: 'V' }]} onChange={(v) => set((x) => void (x.neck.profile = v))} />
        </Row>
        <Row label="Depth @ 1st">
          <Slider value={n.thickness1} min={17} max={26} step={0.1} unit="mm" onChange={(v) => set((x) => void (x.neck.thickness1 = v), { coalesce: 't1' })} />
        </Row>
        <Row label="Depth @ 12th">
          <Slider value={n.thickness12} min={18} max={28} step={0.1} unit="mm" onChange={(v) => set((x) => void (x.neck.thickness12 = v), { coalesce: 't12' })} />
        </Row>
        <Row label="Nut width">
          <Slider value={n.nutWidth} min={38} max={56} step={0.1} unit="mm" onChange={(v) => set((x) => void (x.neck.nutWidth = v), { coalesce: 'nw' })} />
        </Row>
        <Row label="Width gain">
          <Slider value={n.taper} min={6} max={20} step={0.1} unit="mm" onChange={(v) => set((x) => void (x.neck.taper = v), { coalesce: 'tp' })} />
        </Row>
      </Section>
      <Section title="Fretboard">
        <WoodPicker value={n.fretboardWood} use="fretboard" onChange={(id) => set((x) => {
          x.neck.fretboardWood = id!
          x.finish.fretboard = id!.includes('maple') ? 'clear' : 'oil'
        })} />
        <Row label="Radius (nut)">
          <Slider value={n.radius} min={7.25} max={20} step={0.25} unit='"' onChange={(v) => set((x) => {
            const compound = x.neck.radius !== x.neck.radiusEnd
            x.neck.radius = v
            if (!compound) x.neck.radiusEnd = v
          }, { coalesce: 'r1' })} />
        </Row>
        <Row label="Radius (last fret)">
          <Slider value={n.radiusEnd} min={7.25} max={20} step={0.25} unit='"' onChange={(v) => set((x) => void (x.neck.radiusEnd = v), { coalesce: 'r2' })} />
        </Row>
        <p className="hint">{n.radius === n.radiusEnd ? `${n.radius}" radius` : `Compound ${n.radius}"–${n.radiusEnd}"`}</p>
        <Row label="Fret wire">
          <Select value={n.fretWire} options={[{ v: 'narrow', l: 'Narrow / vintage' }, { v: 'medium', l: 'Medium' }, { v: 'jumbo', l: 'Jumbo (wide)' }, { v: 'stainless', l: 'Stainless steel' }, { v: 'gold', l: 'Gold (EVO-style)' }]} onChange={(v) => set((x) => void (x.neck.fretWire = v))} />
        </Row>
        <Row label="Binding">
          <Toggle checked={n.fretboardBinding.enabled} onChange={(v) => set((x) => void (x.neck.fretboardBinding.enabled = v))} />
        </Row>
        {n.fretboardBinding.enabled && (
          <Row label="Binding colour">
            <ColorPick value={n.fretboardBinding.color} onChange={(v) => set((x) => void (x.neck.fretboardBinding.color = v), { coalesce: 'fbc' })} swatches={['#efe6cf', '#f7f5ef', '#111111']} />
          </Row>
        )}
      </Section>
      <Section title="Nut & truss rod">
        <Row label="Nut">
          <Select value={n.nut} options={[{ v: 'bone', l: 'Unbleached bone' }, { v: 'bone-bleached', l: 'Bleached bone' }, { v: 'tusq', l: 'TUSQ (white)' }, { v: 'tusq-black', l: 'Black TUSQ XL' }, { v: 'black-bone', l: 'Black bone' }]} onChange={(v) => set((x) => void (x.neck.nut = v))} />
        </Row>
        {d.hardware.bridge === 'floyd' && <p className="hint">Floyd Rose: a locking nut is added automatically.</p>}
        <Row label="Truss access">
          <Seg value={n.truss} options={[{ v: 'headstock', l: 'Headstock' }, { v: 'heel', l: 'Heel' }, { v: 'spoke', l: 'Spoke wheel' }]} onChange={(v) => set((x) => void (x.neck.truss = v))} />
        </Row>
        <Row label="Carbon rods">
          <Toggle checked={n.carbonRods} onChange={(v) => set((x) => void (x.neck.carbonRods = v))} />
        </Row>
      </Section>
    </>
  )
}

export function HeadstockPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const open = useStore((s) => s.openModal)
  const h = d.headstock
  const mode = (h.custom ?? headstockTemplate(h.shapeId).shape).tuners.mode
  return (
    <>
      <Section
        title="Headstock shape"
        right={
          <button className="btn small" onClick={() => open('head-editor')}>
            <Icon.edit /> Edit outline
          </button>
        }
      >
        {h.custom && (
          <div className="card on" style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <div className="thumb" style={{ height: 50, width: 40 }}>
              <ShapeThumb points={h.custom.points} height={50} />
            </div>
            <div style={{ flex: 1 }} className="lbl">
              Custom headstock
            </div>
            <button className="btn small" onClick={() => set((x) => void (x.headstock.custom = null))}>
              Reset
            </button>
          </div>
        )}
        <div className="grid-cards three">
          {HEADSTOCK_TEMPLATES.map((t) => (
            <button key={t.id} className={'card' + (!h.custom && h.shapeId === t.id ? ' on' : '')} onClick={() => set((x) => setHeadstock(x, t.id))}>
              <div className="thumb">
                <ShapeThumb points={t.shape.points} />
              </div>
              <div className="lbl">{t.name}</div>
            </button>
          ))}
        </div>
        <SourceNote source={headstockTemplate(h.shapeId).source} />
      </Section>
      <Section title="Geometry">
        <Row label="Tilt-back angle">
          <Slider value={h.angle} min={0} max={17} step={0.5} unit="°" onChange={(v) => set((x) => void (x.headstock.angle = v), { coalesce: 'ha' })} />
        </Row>
        <Row label="Thickness">
          <Slider value={h.thickness} min={10} max={20} step={0.5} unit="mm" onChange={(v) => set((x) => void (x.headstock.thickness = v), { coalesce: 'ht' })} />
        </Row>
        <Row label="Reversed">
          <Toggle checked={h.reversed} onChange={(v) => set((x) => void (x.headstock.reversed = v))} />
        </Row>
      </Section>
      <Section title="Face veneer">
        <WoodPicker value={h.veneer} use="headplate" allowNone="None (neck wood)" onChange={(id) => set((x) => void (x.headstock.veneer = id))} />
        <p className="hint">Finish for the face is under Finish → Headstock. Logos go under Graphics.</p>
      </Section>
      {mode !== 'none' ? (
        <Section title="Tuners">
          <ProductPicker value={d.hardware.tunerProductId} options={tunersFor(mode, d.strings)} gbp={d.bom.gbpToUsd} onChange={(id) => set((x) => void (x.hardware.tunerProductId = id))} />
          {d.strings === 7 && <p className="hint">7-string: priced as individual tuners × 7.</p>}
        </Section>
      ) : (
        <Section title="Tuners">
          <p className="hint">Headless: tuning happens at the bridge. The headpiece is included with the headless bridge.</p>
        </Section>
      )}
    </>
  )
}

const PATTERNS: { v: InlayPattern; l: string }[] = [
  { v: 'none', l: 'None' },
  { v: 'dots', l: 'Dots' },
  { v: 'offset-dots', l: 'Offset dots' },
  { v: 'blocks', l: 'Blocks' },
  { v: 'trapezoids', l: 'Trapezoids' },
  { v: 'sharktooth', l: 'Sharktooth' },
  { v: 'diamonds', l: 'Diamonds' },
  { v: 'crescents', l: 'Moons' },
  { v: 'triangles', l: 'Side triangles' },
  { v: 'image', l: 'Your image (each fret)' },
  { v: 'spanning-image', l: 'Your image (full board)' },
]

function PatternIcon({ p }: { p: InlayPattern }) {
  const shapes: Record<string, ReactElement> = {
    none: <></>,
    dots: <circle cx="20" cy="20" r="5" />,
    'offset-dots': <circle cx="12" cy="20" r="4.5" />,
    blocks: <rect x="7" y="13" width="26" height="14" rx="1" />,
    trapezoids: <path d="M7 11 L33 15 L33 25 L7 29Z" />,
    sharktooth: <path d="M6 30 L34 30 L34 9Z" />,
    diamonds: <path d="M20 9 L31 20 L20 31 L9 20Z" />,
    crescents: <path d="M26 10a10 10 0 100 20 8 8 0 110-20z" />,
    triangles: <path d="M5 12 L18 20 L5 28Z" />,
    image: <path d="M10 28l6-8 5 5 4-4 6 7z M14 14a2.5 2.5 0 100 .1" />,
    'spanning-image': <path d="M14 34 C14 20 26 18 22 6 M22 22 C28 20 30 16 28 12 M18 26 C12 24 10 18 12 14" fill="none" stroke="currentColor" strokeWidth="2" />,
  }
  return (
    <svg viewBox="0 0 40 40" style={{ height: 34, color: '#e8dfcf' }} fill="currentColor">
      <rect x="2" y="2" width="36" height="36" rx="3" fill="#3b2a20" />
      {shapes[p]}
    </svg>
  )
}

const MATERIALS: InlayMaterial[] = ['mop', 'abalone', 'gold-mop', 'black-pearl', 'pearloid', 'clay', 'glow', 'maple', 'ebony', 'color']

function MaterialSwatch({ m, color, on, onClick }: { m: InlayMaterial; color: string; on: boolean; onClick: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => setUrl(inlaySwatch(m, color).toDataURL()), [m, color])
  return <span className={'swatch' + (on ? ' on' : '')} title={INLAY_LABEL[m]} onClick={onClick} style={{ width: 28, height: 28, background: m === 'color' ? color : `url(${url}) center/cover` }} />
}

export function InlaysPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const i = d.inlays
  const isImage = i.pattern === 'image' || i.pattern === 'spanning-image'
  const img = i.imageId ? getLoadedImage(i.imageId) : null
  const upload = async (src: Blob | string) => {
    const id = await putImage(src)
    set((x) => void (x.inlays.imageId = id))
  }
  return (
    <>
      <Section title="Pattern">
        <div className="grid-cards three">
          {PATTERNS.map((p) => (
            <button key={p.v} className={'card' + (i.pattern === p.v ? ' on' : '')} onClick={() => set((x) => void (x.inlays.pattern = p.v))} style={{ alignItems: 'center' }}>
              <PatternIcon p={p.v} />
              <div className="lbl" style={{ textAlign: 'center' }}>
                {p.l}
              </div>
            </button>
          ))}
        </div>
      </Section>
      {isImage && (
        <Section title="Inlay artwork">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            {img ? <img src={img.src} style={{ width: 54, height: 54, objectFit: 'contain', background: '#2a2420', borderRadius: 6 }} /> : <div className="empty" style={{ padding: 8 }}>No image yet</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <FileButton onFile={upload}>Upload image…</FileButton>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn small" onClick={() => upload(sampleArt('tree'))}>Vine</button>
                <button className="btn small" onClick={() => upload(sampleArt('stars'))}>Stars</button>
                <button className="btn small" onClick={() => upload(sampleArt('flames'))}>Flames</button>
              </div>
            </div>
          </div>
          <Row label="Cut as inlay">
            <Toggle checked={i.imageAsMask} onChange={(v) => set((x) => void (x.inlays.imageAsMask = v))} />
          </Row>
          <p className="hint">On: the image's shape (transparent PNG, or dark lines on white) is cut from the inlay material and colour below. Off: the picture is shown as-is.</p>
          {i.pattern === 'spanning-image' && (
            <>
              <Row label="Start (from nut)">
                <Slider value={i.spanStart} min={0} max={300} step={1} unit="mm" onChange={(v) => set((x) => void (x.inlays.spanStart = v), { coalesce: 'ss' })} />
              </Row>
              <Row label="Stretch to length">
                <Toggle checked={i.spanStretch} onChange={(v) => set((x) => void (x.inlays.spanStretch = v))} />
              </Row>
              {i.spanStretch && (
                <Row label="Length">
                  <Slider value={i.spanLength} min={40} max={520} step={1} unit="mm" onChange={(v) => set((x) => void (x.inlays.spanLength = v), { coalesce: 'sl' })} />
                </Row>
              )}
              <p className="hint">Use Size to scale the artwork across the board.</p>
            </>
          )}
        </Section>
      )}
      {i.pattern !== 'none' && (
        <Section title="Material & colour">
          <div className="color" style={{ gap: 6 }}>
            {MATERIALS.map((m) => (
              <MaterialSwatch key={m} m={m} color={i.color} on={i.material === m} onClick={() => set((x) => void (x.inlays.material = m))} />
            ))}
          </div>
          <p className="hint">{INLAY_LABEL[i.material]}</p>
          {(i.material === 'color' || isImage) && (
            <Row label="Colour">
              <ColorPick value={i.color} onChange={(v) => set((x) => void (x.inlays.color = v), { coalesce: 'ic' })} swatches={['#f5f0e6', '#111111', '#d4af37', '#c0392b', '#2e86de', '#27ae60', '#8e44ad']} />
            </Row>
          )}
          <Row label="Size">
            <Slider value={i.size} min={0.5} max={1.6} step={0.05} onChange={(v) => set((x) => void (x.inlays.size = v), { coalesce: 'isz' })} />
          </Row>
        </Section>
      )}
      {i.pattern !== 'none' && i.pattern !== 'spanning-image' && (
        <Section
          title="Inlay frets"
          right={
            <span style={{ display: 'flex', gap: 4 }}>
              <button className="btn small" onClick={() => set((x) => void (x.inlays.frets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]))}>Standard</button>
              <button className="btn small" onClick={() => set((x) => void (x.inlays.frets = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24]))}>+1st</button>
            </span>
          }
        >
          <div className="chips">
            {Array.from({ length: d.frets }, (_, k) => k + 1).map((n) => (
              <button key={n} className={'chip' + (i.frets.includes(n) ? ' on' : '')} onClick={() => set((x) => void (x.inlays.frets = x.inlays.frets.includes(n) ? x.inlays.frets.filter((f) => f !== n) : [...x.inlays.frets, n].sort((a, b) => a - b)))}>
                {n}
              </button>
            ))}
          </div>
          <Row label="Double at 12/24">
            <Toggle checked={i.doubleAt12} onChange={(v) => set((x) => void (x.inlays.doubleAt12 = v))} />
          </Row>
        </Section>
      )}
      <Section title="Side dots">
        <Row label="Side dots">
          <Toggle checked={i.sideDots} onChange={(v) => set((x) => void (x.inlays.sideDots = v))} />
        </Row>
        {i.sideDots && (
          <Row label="Material">
            <Seg value={i.sideDotMaterial} options={[{ v: 'white', l: 'White' }, { v: 'black', l: 'Black' }, { v: 'glow', l: 'Glow' }]} onChange={(v) => set((x) => void (x.inlays.sideDotMaterial = v))} />
          </Row>
        )}
      </Section>
    </>
  )
}
