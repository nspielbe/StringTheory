import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { BOM_GROUPS, bomCsv, bomTotals, buildBom, formatUsd, weightEstimate, type BomLine } from '../lib/bom'
import { PRICE_CHECKED, PRODUCTS, VENDORS } from '../data/catalog'
import { wood } from '../data/woods'
import { resolveBody } from '../lib/layout'
import { polygonArea } from '../lib/geometry'
import { download, slug } from '../lib/persistence'
import { Modal, Row, Slider, Toggle } from './controls'
import { Icon } from './icons'

const GROUP_COLORS = ['#c98a4b', '#8fb3c9', '#d36b5a', '#7cc492', '#b7a2d9', '#e6b450']

export function useBom() {
  const d = useStore((s) => s.design)
  const lines = useMemo(() => buildBom(d), [d])
  const totals = useMemo(() => bomTotals(lines), [lines])
  return { d, lines, totals }
}

function estVolume(d: ReturnType<typeof useStore.getState>['design']) {
  const b = resolveBody(d)
  const a = polygonArea(b.outline)
  const carve = d.body.top.enabled && d.body.top.carved ? d.body.top.carveHeight * 0.5 : 0
  return a * (d.body.thickness * 0.94 + carve) * 0.88
}

export function BuildSheet() {
  const { d, lines, totals } = useBom()
  const open = useStore((s) => s.openModal)
  const [collapsed, setCollapsed] = useState(false)
  const b = resolveBody(d).bounds
  const kg = weightEstimate(d, estVolume(d))
  if (collapsed)
    return (
      <aside className="sheet collapsed">
        <button className="btn ghost icon" style={{ margin: 7 }} onClick={() => setCollapsed(false)} title="Show build sheet">
          <Icon.list />
        </button>
      </aside>
    )
  return (
    <aside className="sheet">
      <div className="sheet-head">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="sheet-sub">Estimated parts cost</span>
          <button className="btn ghost icon small" onClick={() => setCollapsed(true)} title="Hide">
            <span style={{ transform: 'rotate(0deg)', display: 'inline-flex' }}>
              <Icon.chevron />
            </span>
          </button>
        </div>
        <div className="sheet-total">{formatUsd(totals.total)}</div>
        <div className="sheet-sub">
          {totals.lines} items · {formatUsd(totals.estimated)} estimated · prices checked {PRICE_CHECKED}
        </div>
        <div className="bars">
          {BOM_GROUPS.map((g, i) => (
            <div key={g} style={{ width: `${(totals.byGroup[g] / Math.max(1, totals.total)) * 100}%`, background: GROUP_COLORS[i] }} title={`${g}: ${formatUsd(totals.byGroup[g])}`} />
          ))}
        </div>
        <div className="legend">
          {BOM_GROUPS.map((g, i) => (
            <span key={g}>
              <i style={{ background: GROUP_COLORS[i] }} />
              {g.split(' ')[0]} {formatUsd(totals.byGroup[g]).replace('.00', '')}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button className="btn primary small" style={{ flex: 1 }} onClick={() => open('bom')}>
            <Icon.list /> Full parts list
          </button>
          <button className="btn small" onClick={() => open('blueprint')} title="1:1 printable templates">
            <Icon.ruler /> Templates
          </button>
        </div>
      </div>
      <div className="sheet-body">
        <dl className="specs">
          <dt>Scale / frets</dt>
          <dd>
            {(d.scale / 25.4).toFixed(2)}" · {d.frets} frets · {d.strings}-string
          </dd>
          <dt>Body</dt>
          <dd>
            {wood(d.body.wood).name}
            {d.body.top.enabled ? ` + ${wood(d.body.top.wood).name}` : ''}
          </dd>
          <dt>Neck</dt>
          <dd>
            {wood(d.neck.wood).name} / {wood(d.neck.fretboardWood).name}
          </dd>
          <dt>Nut · radius</dt>
          <dd>
            {d.neck.nutWidth.toFixed(1)} mm · {d.neck.radius === d.neck.radiusEnd ? d.neck.radius + '"' : `${d.neck.radius}–${d.neck.radiusEnd}"`}
          </dd>
          <dt>Body size</dt>
          <dd>
            {(b.h / 25.4).toFixed(1)}" × {(b.w / 25.4).toFixed(1)}" × {(d.body.thickness / 25.4).toFixed(2)}"
          </dd>
          <dt>Est. weight</dt>
          <dd>
            {kg.toFixed(1)} kg / {(kg * 2.2046).toFixed(1)} lb
          </dd>
        </dl>
        {BOM_GROUPS.map((g) => {
          const ls = lines.filter((l) => l.group === g)
          if (!ls.length) return null
          return (
            <div key={g} className="bom-group">
              <h4>
                <span>{g}</span>
                <span>{formatUsd(ls.filter((l) => !l.excluded).reduce((s, l) => s + l.unit * l.qty, 0))}</span>
              </h4>
              {ls.map((l) => (
                <div key={l.key} className={'bom-line' + (l.excluded ? ' excluded' : '')}>
                  <div>
                    <div className="role">{l.role}</div>
                    <div className="nm">
                      {l.url ? (
                        <a href={l.url} target="_blank" rel="noreferrer">
                          {l.name}
                        </a>
                      ) : (
                        l.name
                      )}
                    </div>
                  </div>
                  <div className="amt">
                    {l.qty > 1 && <span style={{ color: 'var(--dim)' }}>{l.qty}× </span>}
                    {formatUsd(l.unit * l.qty)}
                    {!l.verified && <div className="tag est" style={{ marginTop: 2 }}>est.</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        <p className="hint" style={{ padding: '0 16px' }}>
          Raw materials and parts only — no tools, shipping or tax. "From" prices are the cheapest option on the vendor page.
        </p>
      </div>
    </aside>
  )
}

export function BomModal() {
  const { d, lines, totals } = useBom()
  const set = useStore((s) => s.set)
  const close = () => useStore.getState().openModal(null)
  const ov = (key: string, patch: Partial<{ price: number; qty: number; exclude: boolean; productId: string }>) =>
    set((x) => {
      x.bom.overrides[key] = { ...(x.bom.overrides[key] ?? {}), ...patch }
    })
  const printable = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const rows = BOM_GROUPS.map((g) => {
      const ls = lines.filter((l) => l.group === g && !l.excluded)
      if (!ls.length) return ''
      return `<tr><th colspan="5" style="text-align:left;background:#eee;padding:6px">${g}</th></tr>` + ls.map((l) => `<tr><td>${l.role}</td><td>${l.url ? `<a href="${l.url}">${l.name}</a>` : l.name}<br><small>${l.vendor}${l.note ? ' · ' + l.note : ''}</small></td><td style="text-align:right">${l.qty}</td><td style="text-align:right">${formatUsd(l.unit)}${l.verified ? '' : '*'}</td><td style="text-align:right">${formatUsd(l.unit * l.qty)}</td></tr>`).join('')
    }).join('')
    w.document.write(`<!doctype html><title>${d.name} — parts list</title><style>body{font:13px system-ui;margin:30px;color:#222}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:5px 6px;vertical-align:top}small{color:#777}</style><h1>${d.name}</h1><p>Parts list generated by StringTheory · prices checked ${PRICE_CHECKED} · * = estimate</p><table><tr><th>Part</th><th>Item</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr>${rows}<tr><td></td><td><b>Total</b></td><td></td><td></td><td style="text-align:right"><b>${formatUsd(totals.total)}</b></td></tr></table>`)
    w.document.close()
    w.focus()
    w.print()
  }
  const vendorsUsed = [...new Set(lines.filter((l) => !l.excluded).map((l) => l.vendor))]
  return (
    <Modal
      title={`Parts list — ${d.name}`}
      onClose={close}
      actions={
        <>
          <button className="btn small" onClick={() => download(slug(d.name) + '-parts.csv', new Blob([bomCsv(d, lines)], { type: 'text/csv' }))}>Export CSV</button>
          <button className="btn small" onClick={printable}>Print / PDF</button>
        </>
      }
      foot={
        <>
          <span style={{ marginRight: 'auto' }} className="hint">
            {vendorsUsed.length} vendors: {vendorsUsed.join(', ')}
          </span>
          <span className="sheet-total" style={{ fontSize: 20 }}>{formatUsd(totals.total)}</span>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 18 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Part</th>
              <th>Item & vendor</th>
              <th className="r">Qty</th>
              <th className="r">Unit $</th>
              <th className="r">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {BOM_GROUPS.map((g) => {
              const ls = lines.filter((l) => l.group === g)
              if (!ls.length) return null
              return [
                <tr key={g} className="group">
                  <td colSpan={6}>{g}</td>
                </tr>,
                ...ls.map((l: BomLine) => (
                  <tr key={l.key} style={{ opacity: l.excluded ? 0.45 : 1 }}>
                    <td>
                      <input type="checkbox" checked={!l.excluded} onChange={(e) => ov(l.key, { exclude: !e.target.checked })} title="Include (untick for parts you already have)" />
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{l.role}</td>
                    <td>
                      {l.alternatives.length ? (
                        <select value={l.productId} onChange={(e) => ov(l.key, { productId: e.target.value, price: undefined })} style={{ marginBottom: 4 }}>
                          {[l.productId!, ...l.alternatives].map((id) => (
                            <option key={id} value={id}>
                              {PRODUCTS[id].name} — {VENDORS[PRODUCTS[id].vendor].name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>{l.name}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>{l.vendor}</span>
                        {l.url && (
                          <a href={l.url} target="_blank" rel="noreferrer">
                            open ↗
                          </a>
                        )}
                        {l.currency === 'GBP' && <span>£{l.listPrice} list</span>}
                        {l.from && <span className="tag">from</span>}
                        {l.verified ? <span className="tag ok">listed</span> : <span className="tag est">estimate</span>}
                      </div>
                      {l.note && <div style={{ fontSize: 11.5, color: 'var(--dim)', marginTop: 2 }}>{l.note}</div>}
                    </td>
                    <td className="r">
                      <input className="num qty" type="number" min={0} value={l.qty} onChange={(e) => ov(l.key, { qty: Math.max(0, +e.target.value) })} />
                    </td>
                    <td className="r">
                      <input className="num" type="number" min={0} step={0.01} value={l.unit} onChange={(e) => ov(l.key, { price: Math.max(0, +e.target.value) })} />
                    </td>
                    <td className="r">{formatUsd(l.unit * l.qty)}</td>
                  </tr>
                )),
              ]
            })}
          </tbody>
        </table>
        <div>
          <div className="section" style={{ paddingTop: 0 }}>
            <h3>Totals</h3>
            {BOM_GROUPS.map((g) => (
              <div key={g} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span style={{ color: 'var(--muted)' }}>{g}</span>
                <span className="price">{formatUsd(totals.byGroup[g])}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontWeight: 700 }}>
              <span>Total</span>
              <span className="price">{formatUsd(totals.total)}</span>
            </div>
            <p className="hint">{formatUsd(totals.estimated)} of this is estimated (marked "estimate").</p>
          </div>
          <div className="section">
            <h3>Options</h3>
            <Row label="Finishing supplies">
              <Toggle checked={d.bom.includeFinishing} onChange={(v) => set((x) => void (x.bom.includeFinishing = v))} />
            </Row>
            <Row label="Strings">
              <Toggle checked={d.bom.includeStrings} onChange={(v) => set((x) => void (x.bom.includeStrings = v))} />
            </Row>
            <Row label="£ → $ rate">
              <Slider value={d.bom.gbpToUsd} min={1} max={1.6} step={0.01} digits={2} onChange={(v) => set((x) => void (x.bom.gbpToUsd = v), { coalesce: 'gbp' })} />
            </Row>
            <button className="btn small" onClick={() => set((x) => void (x.bom.overrides = {}))} disabled={!Object.keys(d.bom.overrides).length}>
              Reset my price/qty edits
            </button>
          </div>
          <div className="section">
            <h3>About prices</h3>
            <p className="hint">Prices were read from each store on {PRICE_CHECKED}. Edit any price or quantity — your edits are saved with the design. Untick anything you already own.</p>
            <p className="hint">{VENDORS.ewz.note}</p>
            <p className="hint">{VENDORS.bkp.note}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
