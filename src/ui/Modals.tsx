import { useEffect, useMemo, useState } from 'react'
import type { Design } from '../types'
import { useStore } from '../store'
import { renderApi, type CaptureOptions } from '../three/Scene'
import { PRESETS, makeDesign } from '../data/presets'
import { BODY_TEMPLATES } from '../data/bodyShapes'
import { deleteDesign, download, exportDesignFile, importDesignFile, listDesigns, saveDesign, shareLink, slug } from '../lib/persistence'
import { bomCsv, buildBom } from '../lib/bom'
import { blueprintSvg } from '../lib/svgExport'
import { uid } from '../lib/geometry'
import { FileButton, Modal, Row, Seg } from './controls'
import { ShapeThumb } from './ShapeThumb'

const VIEWS: { v: string; l: string }[] = [
  { v: 'hero', l: 'Hero' },
  { v: 'three-quarter', l: '3/4' },
  { v: 'front', l: 'Front' },
  { v: 'back', l: 'Back' },
  { v: 'side', l: 'Side' },
  { v: 'edge', l: 'Low angle' },
  { v: 'body', l: 'Body close-up' },
  { v: 'headstock', l: 'Headstock' },
  { v: 'current', l: 'Current view' },
]

const SIZES = [
  { v: '1920x1080', l: '1080p' },
  { v: '2560x1440', l: '1440p' },
  { v: '3840x2160', l: '4K' },
  { v: '2048x2048', l: 'Square' },
  { v: '1440x2560', l: 'Portrait' },
]

export async function thumbnail(): Promise<string | undefined> {
  try {
    return await renderApi.current?.capture({ view: 'three-quarter', width: 360, height: 270, background: 'studio' })
  } catch {
    return undefined
  }
}

export function RenderStudio() {
  const d = useStore((s) => s.design)
  const close = () => useStore.getState().openModal(null)
  const [views, setViews] = useState<string[]>(['hero', 'front', 'back', 'body', 'headstock'])
  const [bg, setBg] = useState<CaptureOptions['background']>('studio')
  const [size, setSize] = useState('1920x1080')
  const [busy, setBusy] = useState(false)
  const [shots, setShots] = useState<{ view: string; url: string }[]>([])

  const run = async () => {
    if (!renderApi.current) return
    setBusy(true)
    const [w, h] = size.split('x').map(Number)
    const out: { view: string; url: string }[] = []
    for (const v of views) {
      await new Promise((r) => setTimeout(r, 30))
      out.push({ view: v, url: await renderApi.current.capture({ view: v, width: w, height: h, background: bg }) })
      setShots([...out])
    }
    setBusy(false)
  }
  const sheet = async () => {
    const imgs = await Promise.all(shots.map((s) => new Promise<HTMLImageElement>((r) => { const i = new Image(); i.onload = () => r(i); i.src = s.url })))
    const cols = Math.min(3, imgs.length)
    const rows = Math.ceil(imgs.length / cols)
    const tw = 960
    const th = Math.round((tw * imgs[0].height) / imgs[0].width)
    const c = document.createElement('canvas')
    c.width = cols * tw
    c.height = rows * th + 70
    const g = c.getContext('2d')!
    g.fillStyle = '#16130f'
    g.fillRect(0, 0, c.width, c.height)
    imgs.forEach((im, i) => g.drawImage(im, (i % cols) * tw, Math.floor(i / cols) * th + 70, tw, th))
    g.fillStyle = '#efe8dd'
    g.font = '600 30px system-ui'
    g.fillText(d.name, 24, 46)
    download(slug(d.name) + '-renders.png', c.toDataURL('image/png'))
  }
  return (
    <Modal
      title="Render studio"
      onClose={close}
      foot={
        <>
          {shots.length > 1 && <button className="btn" onClick={sheet}>Download contact sheet</button>}
          {shots.length > 0 && <button className="btn" onClick={() => shots.forEach((s, i) => setTimeout(() => download(`${slug(d.name)}-${s.view}.png`, s.url), i * 250))}>Download all</button>}
          <button className="btn primary" onClick={run} disabled={busy || !views.length}>{busy ? `Rendering ${shots.length + 1}/${views.length}…` : 'Render'}</button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
        <div>
          <div className="section" style={{ paddingTop: 0 }}>
            <h3>Angles</h3>
            <div className="chips">
              {VIEWS.map((v) => (
                <button key={v.v} className={'chip' + (views.includes(v.v) ? ' on' : '')} onClick={() => setViews((x) => (x.includes(v.v) ? x.filter((y) => y !== v.v) : [...x, v.v]))}>
                  {v.l}
                </button>
              ))}
            </div>
          </div>
          <div className="section">
            <h3>Background</h3>
            <Seg value={bg} options={[{ v: 'studio', l: 'Studio' }, { v: 'dark', l: 'Black' }, { v: 'light', l: 'Light' }, { v: 'warm', l: 'Warm' }, { v: 'transparent', l: 'None' }]} onChange={setBg} />
          </div>
          <div className="section">
            <h3>Size</h3>
            <Seg value={size} options={SIZES} onChange={setSize} />
          </div>
          <p className="hint">Renders use the current design and lighting at full resolution. "None" gives a transparent PNG for mock-ups.</p>
        </div>
        <div>
          {!shots.length && <div className="empty" style={{ padding: 60 }}>Pick angles and press Render.</div>}
          <div className="render-grid">
            {shots.map((s) => (
              <figure key={s.view}>
                <img src={s.url} alt={s.view} />
                <figcaption>
                  <span>{VIEWS.find((v) => v.v === s.view)?.l}</span>
                  <button className="btn small" onClick={() => download(`${slug(d.name)}-${s.view}.png`, s.url)}>Download</button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function Gallery() {
  const close = () => useStore.getState().openModal(null)
  const replace = useStore((s) => s.replace)
  const notify = useStore((s) => s.notify)
  const [tab, setTab] = useState<'mine' | 'start'>('start')
  const [mine, setMine] = useState<Awaited<ReturnType<typeof listDesigns>>>([])
  const refresh = () => listDesigns().then(setMine)
  useEffect(() => {
    listDesigns().then((l) => {
      setMine(l)
      if (l.length) setTab('mine')
    })
  }, [])
  const openDesign = (d: Design) => {
    replace(d)
    close()
  }
  return (
    <Modal title="Designs" onClose={close} size="mid" actions={<Seg value={tab} options={[{ v: 'mine', l: `My designs (${mine.length})` }, { v: 'start', l: 'Start new' }]} onChange={setTab} />}>
      {tab === 'mine' && (
        <>
          {!mine.length && <div className="empty">Nothing saved yet. Designs you save are kept in this browser; use Share → Export file to move them between computers.</div>}
          <div className="grid-cards three">
            {mine.map((m) => (
              <div key={m.id} className="card" onClick={() => openDesign(m.design)}>
                <div className="thumb" style={{ height: 120, background: '#23211f', borderRadius: 6, overflow: 'hidden' }}>
                  {m.thumb ? <img src={m.thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShapeThumb points={m.design.body.custom?.points ?? BODY_TEMPLATES.find((t) => t.id === m.design.body.shapeId)!.shape.points} />}
                </div>
                <div className="lbl">{m.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="sub">{new Date(m.updatedAt).toLocaleDateString()}</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    <button className="btn small" onClick={(e) => {
                      e.stopPropagation()
                      const copy = { ...structuredClone(m.design), id: uid('g'), name: m.name + ' (copy)' }
                      saveDesign(copy, m.thumb).then(refresh)
                    }}>Duplicate</button>
                    <button className="btn small danger" onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${m.name}" from this browser? This cannot be undone.`)) deleteDesign(m.id).then(() => {
                        refresh()
                        notify('Design deleted')
                      })
                    }}>Delete</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'start' && (
        <>
          <h3 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Example builds</h3>
          <div className="grid-cards three">
            {PRESETS.map((p) => (
              <button key={p.id} className="card" onClick={() => openDesign(p.make())}>
                <div className="lbl" style={{ fontWeight: 600 }}>{p.name}</div>
                <div className="sub">{p.blurb}</div>
              </button>
            ))}
          </div>
          <h3 style={{ margin: '18px 0 8px', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Blank by body style</h3>
          <div className="grid-cards three">
            {BODY_TEMPLATES.map((t) => (
              <button key={t.id} className="card" onClick={() => openDesign({ ...makeDesign(t.id), name: 'New ' + t.name.split(' (')[0] })}>
                <div className="thumb">
                  <ShapeThumb points={t.shape.points} />
                </div>
                <div className="lbl">{t.name}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}

export function ShareModal() {
  const d = useStore((s) => s.design)
  const replace = useStore((s) => s.replace)
  const notify = useStore((s) => s.notify)
  const close = () => useStore.getState().openModal(null)
  const [link, setLink] = useState<{ url: string; droppedImages: number } | null>(null)
  useEffect(() => {
    shareLink(d).then(setLink)
  }, [d])
  return (
    <Modal title="Share & export" onClose={close} size="narrow">
      <div className="section" style={{ paddingTop: 0 }}>
        <h3>Share link</h3>
        <p className="hint">Anyone with the link opens this design in their browser — no account needed.</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" readOnly value={link?.url ?? 'Generating…'} onFocus={(e) => e.target.select()} />
          <button className="btn primary" disabled={!link} onClick={() => link && navigator.clipboard.writeText(link.url).then(() => notify('Link copied'))}>Copy</button>
        </div>
        {link && link.droppedImages > 0 && <p className="hint warn">Links can't carry uploaded images ({link.droppedImages}). Use "Export design file" to share graphics too.</p>}
      </div>
      <div className="section">
        <h3>Design file</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn" onClick={async () => download(slug(d.name) + '.guitar.json', await exportDesignFile(d))}>Export design file</button>
          <FileButton className="btn" accept=".json,application/json" onFile={async (f) => {
            try {
              replace(await importDesignFile(await f.text()))
              notify('Design imported')
              close()
            } catch {
              notify('That file could not be read')
            }
          }}>Import design file…</FileButton>
        </div>
        <p className="hint">Files include uploaded images, so graphics survive the trip.</p>
      </div>
      <div className="section">
        <h3>Build documents</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => download(slug(d.name) + '-parts.csv', new Blob([bomCsv(d, buildBom(d))], { type: 'text/csv' }))}>Parts list (CSV)</button>
          <button className="btn" onClick={() => download(slug(d.name) + '-templates.svg', new Blob([blueprintSvg(d).svg], { type: 'image/svg+xml' }))}>1:1 templates (SVG)</button>
          <button className="btn" onClick={() => useStore.getState().openModal('render')}>Renders…</button>
        </div>
      </div>
    </Modal>
  )
}

export function BlueprintModal() {
  const d = useStore((s) => s.design)
  const close = () => useStore.getState().openModal(null)
  const bp = useMemo(() => blueprintSvg(d), [d])
  const url = useMemo(() => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bp.svg), [bp])
  return (
    <Modal
      title="1:1 build templates"
      onClose={close}
      foot={
        <>
          <span className="hint" style={{ marginRight: 'auto' }}>
            {(bp.widthMm / 25.4).toFixed(1)}" × {(bp.heightMm / 25.4).toFixed(1)}" sheet · print at 100% and tile, or send to a large-format printer / CNC
          </span>
          <button className="btn primary" onClick={() => download(slug(d.name) + '-templates.svg', new Blob([bp.svg], { type: 'image/svg+xml' }))}>Download SVG</button>
        </>
      }
    >
      <Row full>
        <div style={{ background: '#fff', borderRadius: 8, padding: 10, maxHeight: '68vh', overflow: 'auto' }}>
          <img src={url} style={{ width: '100%', display: 'block' }} alt="Templates" />
        </div>
      </Row>
    </Modal>
  )
}
