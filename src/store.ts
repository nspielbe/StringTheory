import { create } from 'zustand'
import type { Design } from './types'
import { PRESETS } from './data/presets'

export type Panel =
  | 'body'
  | 'top'
  | 'neck'
  | 'headstock'
  | 'inlays'
  | 'pickups'
  | 'hardware'
  | 'finish'
  | 'graphics'
  | 'info'

export type Modal = null | 'body-editor' | 'head-editor' | 'guard-editor' | 'render' | 'gallery' | 'share' | 'bom' | 'blueprint' | 'plans'

/** A plan the next outline editor should open with as its tracing reference. */
export interface TracePlanRequest {
  planId: string
  editor: 'body' | 'head' | 'guard'
}

interface State {
  design: Design
  past: Design[]
  future: Design[]
  panel: Panel
  modal: Modal
  selectedDecal: string | null
  showStrings: boolean
  showHardware: boolean
  autoRotate: boolean
  viewRequest: { view: string; n: number }
  dirty: boolean
  toast: string | null
  tracePlan: TracePlanRequest | null
  /** Plan to show when the plan library opens. */
  plansOpenId: string | null

  set: (fn: (d: Design) => void, opts?: { coalesce?: string }) => void
  replace: (d: Design) => void
  undo: () => void
  redo: () => void
  setPanel: (p: Panel) => void
  openModal: (m: Modal) => void
  selectDecal: (id: string | null) => void
  toggle: (k: 'showStrings' | 'showHardware' | 'autoRotate') => void
  requestView: (view: string) => void
  notify: (msg: string) => void
  markSaved: () => void
  traceWithPlan: (req: TracePlanRequest | null) => void
  showPlan: (id: string) => void
}

let lastCoalesce: { key: string; t: number } | null = null

export const useStore = create<State>((set, get) => ({
  design: PRESETS[0].make(),
  past: [],
  future: [],
  panel: 'body',
  modal: null,
  selectedDecal: null,
  showStrings: true,
  showHardware: true,
  autoRotate: false,
  viewRequest: { view: 'three-quarter', n: 0 },
  dirty: false,
  toast: null,
  tracePlan: null,
  plansOpenId: null,

  set: (fn, opts) => {
    const cur = get().design
    const next = structuredClone(cur)
    fn(next)
    next.updatedAt = Date.now()
    const now = performance.now()
    // Slider drags fire many updates: fold them into one undo step.
    const coalesce = opts?.coalesce && lastCoalesce && lastCoalesce.key === opts.coalesce && now - lastCoalesce.t < 900
    lastCoalesce = opts?.coalesce ? { key: opts.coalesce, t: now } : null
    set((s) => ({
      design: next,
      past: coalesce ? s.past : [...s.past.slice(-80), cur],
      future: [],
      dirty: true,
    }))
  },
  replace: (d) => set((s) => ({ design: d, past: [...s.past.slice(-80), s.design], future: [], dirty: false, selectedDecal: null })),
  undo: () =>
    set((s) => {
      if (!s.past.length) return s
      const prev = s.past[s.past.length - 1]
      return { design: prev, past: s.past.slice(0, -1), future: [s.design, ...s.future], dirty: true }
    }),
  redo: () =>
    set((s) => {
      if (!s.future.length) return s
      const [next, ...rest] = s.future
      return { design: next, past: [...s.past, s.design], future: rest, dirty: true }
    }),
  setPanel: (panel) => set({ panel }),
  openModal: (modal) => set({ modal }),
  selectDecal: (selectedDecal) => set({ selectedDecal }),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<State>),
  requestView: (view) => set((s) => ({ viewRequest: { view, n: s.viewRequest.n + 1 } })),
  notify: (toast) => {
    set({ toast })
    setTimeout(() => {
      if (get().toast === toast) set({ toast: null })
    }, 2600)
  },
  markSaved: () => set({ dirty: false }),
  showPlan: (plansOpenId) => set({ plansOpenId, modal: 'plans' }),
  traceWithPlan: (tracePlan) =>
    set({ tracePlan, modal: tracePlan ? (tracePlan.editor === 'body' ? 'body-editor' : tracePlan.editor === 'head' ? 'head-editor' : 'guard-editor') : null }),
}))

export const useDesign = () => useStore((s) => s.design)
export const useSetDesign = () => useStore((s) => s.set)
