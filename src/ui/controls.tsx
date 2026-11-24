import { useEffect, useState, type ReactNode } from 'react'
import { PRODUCTS, VENDORS, type Product } from '../data/catalog'
import { WOODS, type Wood, type WoodUse } from '../data/woods'
import { woodTile } from '../lib/woodTextures'

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="section">
      <h3>
        <span>{title}</span>
        {right}
      </h3>
      {children}
    </div>
  )
}

export function Row({ label, children, full }: { label?: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={'row' + (full || !label ? ' full' : '')}>
      {label && <label>{label}</label>}
      <div>{children}</div>
    </div>
  )
}

export function Slider({ value, min, max, step = 1, onChange, unit, digits }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string; digits?: number }) {
  const dg = digits ?? (step < 0.1 ? 2 : step < 1 ? 1 : 0)
  const [text, setText] = useState(value.toFixed(dg))
  useEffect(() => setText(value.toFixed(dg)), [value, dg])
  return (
    <div className="slider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <div style={{ position: 'relative' }}>
        <input
          className="num"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const v = parseFloat(text)
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
            else setText(value.toFixed(dg))
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          title={unit}
        />
      </div>
    </div>
  )
}

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; l: string; t?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={String(o.v)} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)} title={o.t}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      {label && <span>{label}</span>}
    </label>
  )
}

export function Select<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  )
}

export function ColorPick({ value, onChange, swatches = [] }: { value: string; onChange: (v: string) => void; swatches?: string[] }) {
  return (
    <div className="color">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      {swatches.map((s) => (
        <span key={s} className={'swatch' + (s.toLowerCase() === value.toLowerCase() ? ' on' : '')} style={{ background: s }} onClick={() => onChange(s)} title={s} />
      ))}
    </div>
  )
}

const thumbs = new Map<string, string>()

function WoodSwatch({ w }: { w: Wood }) {
  const [url, setUrl] = useState(thumbs.get(w.id))
  useEffect(() => {
    if (url) return
    let live = true
    woodTile(w.id, 3, 1, 'small').then((c) => {
      const t = document.createElement('canvas')
      t.width = 120
      t.height = 40
      t.getContext('2d')!.drawImage(c, 0, c.height * 0.3, c.width, c.width / 3, 0, 0, 120, 40)
      const u = t.toDataURL('image/jpeg', 0.8)
      thumbs.set(w.id, u)
      if (live) setUrl(u)
    })
    return () => {
      live = false
    }
  }, [w.id, url])
  return <div className="sw" style={{ background: url ? `url(${url}) center/cover` : w.look.light }} />
}

export function WoodPicker({ value, use, onChange, allowNone }: { value: string | null; use: WoodUse; onChange: (id: string | null) => void; allowNone?: string }) {
  const list = WOODS.filter((w) => w.uses[use]?.length)
  return (
    <div className="woodgrid">
      {allowNone && (
        <button className={'wood' + (value === null ? ' on' : '')} onClick={() => onChange(null)}>
          <div className="sw" style={{ background: 'repeating-linear-gradient(45deg,#2a2622 0 6px,#221e1a 6px 12px)' }} />
          <div className="nm">{allowNone}</div>
        </button>
      )}
      {list.map((w) => (
        <button key={w.id} className={'wood' + (value === w.id ? ' on' : '')} onClick={() => onChange(w.id)} title={w.blurb}>
          <WoodSwatch w={w} />
          <div className="nm">{w.name}</div>
        </button>
      ))}
    </div>
  )
}

export function ProductPicker({ value, options, onChange, gbp }: { value: string; options: Product[]; onChange: (id: string) => void; gbp: number }) {
  const p = PRODUCTS[value]
  const price = (x: Product) => (VENDORS[x.vendor].currency === 'GBP' ? `£${x.price} (~$${(x.price * gbp).toFixed(0)})` : `$${x.price.toFixed(2)}`)
  return (
    <div className="product">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {!p && <option value={value}>—</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} — {price(o)}
          </option>
        ))}
      </select>
      {p && (
        <div className="product-meta">
          <span>{VENDORS[p.vendor].name}</span>
          <span className="price">
            {p.from ? 'from ' : ''}
            {price(p)}
          </span>
          {!p.verified && <span className="tag est">estimate</span>}
          <a href={p.url} target="_blank" rel="noreferrer">
            view ↗
          </a>
        </div>
      )}
    </div>
  )
}

export function FileButton({ onFile, children, accept = 'image/*', className = 'btn small' }: { onFile: (f: File) => void; children: ReactNode; accept?: string; className?: string }) {
  return (
    <label className={className} style={{ cursor: 'pointer' }}>
      {children}
      <input
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}

export function Modal({ title, onClose, children, foot, size, actions }: { title: string; onClose: () => void; children: ReactNode; foot?: ReactNode; size?: 'narrow' | 'mid'; actions?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal ' + (size ?? '')}>
        <div className="modal-head">
          <h2>{title}</h2>
          {actions}
          <button className="btn ghost icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  )
}
