import { useEffect, type ReactElement } from 'react'
import { useStore, type Panel } from './store'
import { Scene } from './three/Scene'
import { Icon } from './ui/icons'
import { BodyPanel, FinishPanel, TopPanel } from './ui/panels/BodyPanels'
import { HeadstockPanel, InlaysPanel, NeckPanel } from './ui/panels/NeckPanels'
import { HardwarePanel, PickupsPanel } from './ui/panels/HardwarePanels'
import { GraphicsPanel } from './ui/panels/GraphicsPanel'
import { BuildSheet, BomModal } from './ui/BuildSheet'
import { ShapeEditor } from './ui/ShapeEditor'
import { PlansModal } from './ui/Plans'
import { BlueprintModal, Gallery, RenderStudio, ShareModal, thumbnail } from './ui/Modals'
import { Row, Section } from './ui/controls'
import { designFromHash, loadDraft, saveDesign, saveDraft } from './lib/persistence'
import { PRICE_CHECKED, VENDORS } from './data/catalog'

const PANELS: { id: Panel; label: string; icon: () => ReactElement; title: string; sub: string; el: () => ReactElement }[] = [
  { id: 'body', label: 'Body', icon: Icon.body, title: 'Body', sub: 'Shape, wood, thickness and edges', el: BodyPanel },
  { id: 'top', label: 'Top', icon: Icon.top, title: 'Top', sub: 'Figured caps, drop tops and carving', el: TopPanel },
  { id: 'neck', label: 'Neck', icon: Icon.neck, title: 'Neck & fretboard', sub: 'Scale, carve, woods and frets', el: NeckPanel },
  { id: 'headstock', label: 'Head', icon: Icon.head, title: 'Headstock', sub: 'Shape, angle, veneer and tuners', el: HeadstockPanel },
  { id: 'inlays', label: 'Inlays', icon: Icon.inlay, title: 'Inlays', sub: 'Patterns, pearl and your own art', el: InlaysPanel },
  { id: 'pickups', label: 'Pickups', icon: Icon.pickup, title: 'Pickups & electronics', sub: 'Layout, models and controls', el: PickupsPanel },
  { id: 'hardware', label: 'Hardware', icon: Icon.hardware, title: 'Hardware', sub: 'Bridge, finish, strap and pickguard', el: HardwarePanel },
  { id: 'finish', label: 'Finish', icon: Icon.finish, title: 'Finish', sub: 'Clear, dye, burst or paint per surface', el: FinishPanel },
  { id: 'graphics', label: 'Graphics', icon: Icon.graphics, title: 'Graphics', sub: 'Your images on the body, back, headstock and pickguard', el: GraphicsPanel },
  { id: 'info', label: 'About', icon: Icon.info, title: 'Design info', sub: 'Name, notes and pricing sources', el: InfoPanel },
]

function InfoPanel() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  return (
    <>
      <Section title="Design">
        <Row label="Name">
          <input className="input" value={d.name} onChange={(e) => set((x) => void (x.name = e.target.value), { coalesce: 'name' })} />
        </Row>
        <Row label="Designer">
          <input className="input" value={d.author} placeholder="Your name" onChange={(e) => set((x) => void (x.author = e.target.value), { coalesce: 'author' })} />
        </Row>
        <Row label="Build notes" full>
          <textarea value={d.notes} placeholder="Anything you want to remember when building…" onChange={(e) => set((x) => void (x.notes = e.target.value), { coalesce: 'notes' })} />
        </Row>
      </Section>
      <Section title="Where parts come from">
        {Object.values(VENDORS).map((v) => (
          <p key={v.id} className="hint" style={{ color: 'var(--muted)' }}>
            <a href={v.url} target="_blank" rel="noreferrer">{v.name}</a>
            {v.note ? ` — ${v.note}` : ''}
          </p>
        ))}
        <p className="hint">Prices were read from each store on {PRICE_CHECKED}. Every part links to the product page; open them to confirm stock and options before ordering.</p>
      </Section>
      <Section title="Keyboard">
        <p className="hint"><span className="kbd">⌘/Ctrl Z</span> undo · <span className="kbd">⌘/Ctrl ⇧ Z</span> redo · <span className="kbd">⌘/Ctrl S</span> save</p>
      </Section>
    </>
  )
}

async function save() {
  const s = useStore.getState()
  const thumb = await thumbnail()
  await saveDesign(s.design, thumb)
  s.markSaved()
  s.notify(`Saved "${s.design.name}" to this browser`)
}

function Header() {
  const d = useStore((s) => s.design)
  const set = useStore((s) => s.set)
  const open = useStore((s) => s.openModal)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const dirty = useStore((s) => s.dirty)
  return (
    <header className="header">
      <div className="brand">
        <img src="./favicon.svg" alt="" />
        StringTheory <small>guitar designer</small>
      </div>
      <input className="name-input" value={d.name} onChange={(e) => set((x) => void (x.name = e.target.value), { coalesce: 'name' })} aria-label="Design name" />
      {dirty && <span className="dirty-dot" title="Unsaved changes" />}
      <div className="hdr-group">
        <button className="btn ghost icon" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)"><Icon.undo /></button>
        <button className="btn ghost icon" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)"><Icon.redo /></button>
      </div>
      <div className="spacer" />
      <div className="hdr-group">
        <button className="btn" onClick={() => open('plans')} title="Full-size plans and templates"><Icon.ruler /> Plans</button>
        <button className="btn" onClick={() => open('gallery')}><Icon.folder /> Designs</button>
        <button className="btn" onClick={save}><Icon.save /> Save</button>
        <button className="btn" onClick={() => open('share')}><Icon.share /> Share</button>
        <button className="btn primary" onClick={() => open('render')}><Icon.camera /> Render</button>
      </div>
    </header>
  )
}

function Viewport() {
  const req = useStore((s) => s.requestView)
  const toggle = useStore((s) => s.toggle)
  const showStrings = useStore((s) => s.showStrings)
  const showHardware = useStore((s) => s.showHardware)
  const autoRotate = useStore((s) => s.autoRotate)
  const views = [
    { v: 'three-quarter', l: '3/4' },
    { v: 'front', l: 'Front' },
    { v: 'back', l: 'Back' },
    { v: 'side', l: 'Side' },
    { v: 'body', l: 'Body' },
    { v: 'headstock', l: 'Head' },
  ]
  return (
    <div className="viewport">
      <Scene />
      <div className="vp-tools">
        {views.map((v) => (
          <button key={v.v} className="btn small ghost" onClick={() => req(v.v)}>{v.l}</button>
        ))}
        <div className="sep" />
        <button className={'btn small ' + (showStrings ? '' : 'ghost')} onClick={() => toggle('showStrings')}>Strings</button>
        <button className={'btn small ' + (showHardware ? '' : 'ghost')} onClick={() => toggle('showHardware')}>Hardware</button>
        <button className={'btn small icon ' + (autoRotate ? '' : 'ghost')} onClick={() => toggle('autoRotate')} title="Turntable"><Icon.rotate /></button>
      </div>
    </div>
  )
}

export function App() {
  const panel = useStore((s) => s.panel)
  const setPanel = useStore((s) => s.setPanel)
  const modal = useStore((s) => s.modal)
  const toast = useStore((s) => s.toast)
  const P = PANELS.find((p) => p.id === panel)!

  // load: shared link > autosaved draft > default
  useEffect(() => {
    ;(async () => {
      const shared = await designFromHash()
      if (shared) {
        useStore.getState().replace(shared)
        history.replaceState(null, '', location.pathname + location.search)
        useStore.getState().notify('Opened shared design')
        return
      }
      const draft = await loadDraft()
      if (draft) useStore.setState({ design: draft, past: [], future: [] })
    })()
  }, [])

  // autosave draft
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    return useStore.subscribe((s, p) => {
      if (s.design === p.design) return
      clearTimeout(t)
      t = setTimeout(() => saveDraft(s.design), 700)
    })
  }, [])

  // shortcuts
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const tag = (e.target as HTMLElement).tagName
      if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      } else if (e.key.toLowerCase() === 'z' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !useStore.getState().modal) {
        e.preventDefault()
        if (e.shiftKey) useStore.getState().redo()
        else useStore.getState().undo()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  return (
    <div className="app">
      <Header />
      <div className="main">
        <nav className="rail">
          {PANELS.map((p) => (
            <button key={p.id} className={panel === p.id ? 'on' : ''} onClick={() => setPanel(p.id)} title={p.title}>
              <p.icon />
              {p.label}
            </button>
          ))}
        </nav>
        <section className="panel">
          <div className="panel-head">
            <h2>{P.title}</h2>
            <p>{P.sub}</p>
          </div>
          <div className="panel-body">
            <P.el />
          </div>
        </section>
        <Viewport />
        <BuildSheet />
      </div>
      {modal === 'body-editor' && <ShapeEditor kind="body" />}
      {modal === 'head-editor' && <ShapeEditor kind="head" />}
      {modal === 'guard-editor' && <ShapeEditor kind="guard" />}
      {modal === 'render' && <RenderStudio />}
      {modal === 'gallery' && <Gallery />}
      {modal === 'share' && <ShareModal />}
      {modal === 'bom' && <BomModal />}
      {modal === 'blueprint' && <BlueprintModal />}
      {modal === 'plans' && <PlansModal />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
