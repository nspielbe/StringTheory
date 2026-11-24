import type { BridgeType, HardwareColor, PickupLayout, PickupSlot, PickguardMaterial } from '../../types'
import { useStore } from '../../store'
import { bridgesFor, pickupsFor, PRODUCTS } from '../../data/catalog'
import { setBridge, setPickupLayout } from '../../lib/actions'
import { autoPickguard, resolveHeadstock } from '../../lib/layout'
import { GUARDS, guardSwatch } from '../../lib/patterns'
import { ProductPicker, Row, Section, Seg, Select, Slider, Toggle } from '../controls'
import { Icon } from '../icons'
import { useEffect, useState } from 'react'

const LAYOUTS: { v: PickupLayout; l: string }[] = [
  { v: 'HH', l: 'HH' },
  { v: 'HSS', l: 'HSS' },
  { v: 'SSS', l: 'SSS' },
  { v: 'HSH', l: 'HSH' },
  { v: 'SS', l: 'SS' },
  { v: 'HS', l: 'HS' },
  { v: 'H', l: 'H' },
  { v: 'T', l: 'T-style' },
  { v: 'P90', l: 'P90' },
  { v: 'P90x2', l: '2× P90' },
  { v: 'P90x3', l: '3× P90' },
]

const COVERS: Record<PickupSlot['type'], PickupSlot['cover'][]> = {
  humbucker: ['black', 'zebra', 'reverse-zebra', 'cream', 'nickel', 'chrome', 'gold'],
  single: ['white', 'cream', 'black'],
  'single-hb': ['black', 'white', 'cream'],
  p90: ['cream', 'black', 'white', 'nickel'],
  'tele-bridge': ['black'],
}

const TYPE_LABEL: Record<PickupSlot['type'], string> = {
  humbucker: 'Humbucker',
  single: 'Single coil',
  'single-hb': 'Single-size humbucker / rail',
  p90: 'P90',
  'tele-bridge': 'T-style bridge single',
}

export function PickupsPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const e = d.electronics
  return (
    <>
      <Section title="Pickup layout">
        <div className="chips">
          {LAYOUTS.map((l) => (
            <button key={l.v} className={'chip' + (d.pickupLayout === l.v ? ' on' : '')} onClick={() => set((x) => setPickupLayout(x, l.v))}>
              {l.l}
            </button>
          ))}
        </div>
      </Section>
      {d.pickups.map((s, i) => (
        <Section key={i} title={`${s.position} — ${TYPE_LABEL[s.type]}`}>
          {(s.type === 'single' || s.type === 'single-hb') && (
            <Row label="Type">
              <Seg value={s.type} options={[{ v: 'single', l: 'Single coil' }, { v: 'single-hb', l: 'Rail / stacked' }]} onChange={(v) => set((x) => {
                const p = x.pickups[i]
                p.type = v
                p.productId = pickupsFor(v, x.strings)[0]?.id ?? p.productId
              })} />
            </Row>
          )}
          <ProductPicker value={s.productId} options={pickupsFor(s.type, d.strings).filter((p) => p.pickup!.positions.includes(s.position) || s.position === 'middle')} gbp={d.bom.gbpToUsd} onChange={(id) => set((x) => void (x.pickups[i].productId = id))} />
          {PRODUCTS[s.productId]?.pickup && (
            <p className="hint">
              Output: {PRODUCTS[s.productId].pickup!.output}
              {PRODUCTS[s.productId].pickup!.set ? ` · set of ${PRODUCTS[s.productId].pickup!.set}` : ''}
            </p>
          )}
          <Row label="Cover / bobbins">
            <div className="chips">
              {COVERS[s.type].map((c) => (
                <button key={c} className={'chip' + (s.cover === c ? ' on' : '')} onClick={() => set((x) => void (x.pickups[i].cover = c))}>
                  {c}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Move">
            <Slider value={s.offset} min={-40} max={40} step={1} unit="mm" onChange={(v) => set((x) => void (x.pickups[i].offset = v), { coalesce: 'po' + i })} />
          </Row>
          <Row label="Slant">
            <Slider value={s.slant} min={-15} max={15} step={0.5} unit="°" onChange={(v) => set((x) => void (x.pickups[i].slant = v), { coalesce: 'ps' + i })} />
          </Row>
        </Section>
      ))}
      <Section title="Controls & wiring">
        <Row label="Volume knobs">
          <Seg value={e.volumes} options={[{ v: 0, l: '0' }, { v: 1, l: '1' }, { v: 2, l: '2' }]} onChange={(v) => set((x) => void (x.electronics.volumes = v))} />
        </Row>
        <Row label="Tone knobs">
          <Seg value={e.tones} options={[{ v: 0, l: '0' }, { v: 1, l: '1' }, { v: 2, l: '2' }]} onChange={(v) => set((x) => void (x.electronics.tones = v))} />
        </Row>
        <Row label="Selector">
          <Select value={e.switchType} options={[{ v: 'toggle3', l: '3-way toggle' }, { v: 'blade5', l: '5-way blade' }, { v: 'blade3', l: '3-way blade' }, { v: 'superswitch', l: 'Super switch (5-way, 4-pole)' }, { v: 'none', l: 'None' }]} onChange={(v) => set((x) => void (x.electronics.switchType = v))} />
        </Row>
        <Row label="Knob style">
          <Select value={e.knobStyle} options={[{ v: 'strat', l: 'Skirted (S-style)' }, { v: 'tophat', l: 'Top hat' }, { v: 'speed', l: 'Speed knob' }, { v: 'dome', l: 'Metal dome' }, { v: 'flat', l: 'Metal flat-top' }, { v: 'oring', l: 'Hipshot O-ring' }]} onChange={(v) => set((x) => void (x.electronics.knobStyle = v))} />
        </Row>
        <Row label="Output jack">
          <Select value={e.jack} options={[{ v: 'electrosocket', l: 'Round side socket' }, { v: 'strat-plate', l: 'Angled top plate (S-style)' }, { v: 'tele-cup', l: 'Side cup (T-style)' }, { v: 'lp-plate', l: 'Rectangular side plate' }]} onChange={(v) => set((x) => void (x.electronics.jack = v))} />
        </Row>
        <Row label="Coil split pot">
          <Toggle checked={e.pushPull} onChange={(v) => set((x) => void (x.electronics.pushPull = v))} />
        </Row>
        <Row label="Treble bleed">
          <Toggle checked={e.trebleBleed} onChange={(v) => set((x) => void (x.electronics.trebleBleed = v))} />
        </Row>
        <Row label="Shielding">
          <Toggle checked={e.shielding} onChange={(v) => set((x) => void (x.electronics.shielding = v))} />
        </Row>
        <p className="hint">Knob, switch and jack positions can be moved in Body → Edit outline.</p>
      </Section>
    </>
  )
}

const BRIDGES: { v: BridgeType; l: string }[] = [
  { v: 'fixed', l: 'Fixed (top-load)' },
  { v: 'hardtail', l: 'Hardtail (string-through)' },
  { v: 'tom', l: 'Tune-o-matic + tailpiece' },
  { v: 'vintage-trem', l: 'Vintage 6-screw tremolo' },
  { v: 'two-point-trem', l: '2-point tremolo' },
  { v: 'floyd', l: 'Floyd Rose (locking)' },
  { v: 'tele', l: 'T-style ashtray' },
  { v: 'headless-fixed', l: 'Headless fixed' },
  { v: 'headless-trem', l: 'Headless tremolo' },
]

const HW: { v: HardwareColor; c: string }[] = [
  { v: 'chrome', c: '#e8ebee' },
  { v: 'nickel', c: '#d2c9b6' },
  { v: 'satin', c: '#a8acb0' },
  { v: 'black', c: '#1d1d20' },
  { v: 'gold', c: '#d9b45c' },
]

function GuardSwatch({ m, on, onClick }: { m: PickguardMaterial; on: boolean; onClick: () => void }) {
  const [url, setUrl] = useState('')
  useEffect(() => setUrl(guardSwatch(m).toDataURL()), [m])
  return <span className={'swatch' + (on ? ' on' : '')} title={GUARDS[m].label} onClick={onClick} style={{ width: 28, height: 28, background: GUARDS[m].clear ? 'repeating-linear-gradient(45deg,#666 0 3px,#333 3px 6px)' : `url(${url}) center/cover` }} />
}

export function HardwarePanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const open = useStore((s) => s.openModal)
  const headless = resolveHeadstock(d).mode === 'none'
  return (
    <>
      <Section title="Hardware finish">
        <div className="color">
          {HW.map((h) => (
            <span key={h.v} className={'swatch' + (d.hardware.color === h.v ? ' on' : '')} style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${h.c}, #ffffff 45%, ${h.c})` }} title={h.v} onClick={() => set((x) => void (x.hardware.color = h.v))} />
          ))}
          <span className="hint" style={{ marginLeft: 6 }}>{d.hardware.color}</span>
        </div>
      </Section>
      <Section title="Bridge">
        <Select value={d.hardware.bridge} options={BRIDGES.filter((b) => b.v.startsWith('headless') === headless)} onChange={(v) => set((x) => setBridge(x, v))} />
        <div style={{ height: 8 }} />
        <ProductPicker value={d.hardware.bridgeProductId} options={bridgesFor(d.hardware.bridge, d.strings)} gbp={d.bom.gbpToUsd} onChange={(id) => set((x) => void (x.hardware.bridgeProductId = id))} />
        {headless && <p className="hint">Headless headstock selected — headless bridges only.</p>}
      </Section>
      <Section title="Strap">
        <Seg value={d.hardware.strap} options={[{ v: 'buttons', l: 'Buttons' }, { v: 'schaller', l: 'Schaller S-Lock' }, { v: 'dunlop', l: 'Dunlop Straplok' }]} onChange={(v) => set((x) => void (x.hardware.strap = v))} />
      </Section>
      <Section
        title="Pickguard"
        right={
          d.pickguard.enabled ? (
            <button className="btn small" onClick={() => open('guard-editor')}>
              <Icon.edit /> Edit shape
            </button>
          ) : undefined
        }
      >
        <Row label="Pickguard">
          <Toggle checked={d.pickguard.enabled} onChange={(v) => set((x) => void (x.pickguard.enabled = v))} />
        </Row>
        {d.pickguard.enabled && (
          <>
            <div className="color" style={{ gap: 6, margin: '6px 0' }}>
              {(Object.keys(GUARDS) as PickguardMaterial[]).map((m) => (
                <GuardSwatch key={m} m={m} on={d.pickguard.material === m} onClick={() => set((x) => void (x.pickguard.material = m))} />
              ))}
            </div>
            <p className="hint">{GUARDS[d.pickguard.material].label}</p>
            <button className="btn small" onClick={() => set((x) => void (x.pickguard.shape = { points: autoPickguard(x) }))}>
              Generate from body outline
            </button>
          </>
        )}
      </Section>
    </>
  )
}
