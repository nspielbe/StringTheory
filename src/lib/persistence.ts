import { createStore, del, entries, get, set } from 'idb-keyval'
import type { Design } from '../types'
import { getDataUrl, putImage } from './imageStore'
import { makeDesign } from '../data/presets'

// Saved designs live in IndexedDB (per browser). Designs can be exported as
// a self-contained .json file (images embedded) or shared as a link.

const designs = createStore('stringtheory-designs', 'designs')
const DRAFT = '__draft__'

export interface SavedMeta {
  id: string
  name: string
  updatedAt: number
  thumb?: string
}

export async function saveDesign(d: Design, thumb?: string) {
  await set(d.id, { design: d, thumb, updatedAt: Date.now() }, designs)
}

export async function listDesigns(): Promise<(SavedMeta & { design: Design })[]> {
  const all = await entries<string, { design: Design; thumb?: string; updatedAt: number }>(designs)
  return all
    .filter(([k]) => k !== DRAFT)
    .map(([id, v]) => ({ id, name: v.design.name, updatedAt: v.updatedAt, thumb: v.thumb, design: upgrade(v.design) }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteDesign(id: string) {
  await del(id, designs)
}

export async function saveDraft(d: Design) {
  await set(DRAFT, { design: d, updatedAt: Date.now() }, designs)
}

export async function loadDraft(): Promise<Design | null> {
  const v = await get<{ design: Design }>(DRAFT, designs)
  return v ? upgrade(v.design) : null
}

/** Fill in any fields added after a design was saved. */
export function upgrade(d: Design): Design {
  const base = makeDesign(d.body?.shapeId ?? 's-style', d.strings ?? 6)
  const deep = (b: unknown, o: unknown): unknown => {
    if (Array.isArray(o) || o === null || typeof o !== 'object') return o === undefined ? b : o
    const out: Record<string, unknown> = { ...(b as Record<string, unknown>) }
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) out[k] = deep((b as Record<string, unknown>)?.[k], v)
    return out
  }
  return deep(base, d) as Design
}

// ------------------------------------------------------------------ files

interface DesignFile {
  format: 'stringtheory-design'
  version: 1
  design: Design
  images: Record<string, string>
}

export async function exportDesignFile(d: Design): Promise<Blob> {
  const ids = new Set<string>()
  d.decals.forEach((x) => ids.add(x.imageId))
  if (d.inlays.imageId) ids.add(d.inlays.imageId)
  const images: Record<string, string> = {}
  for (const id of ids) {
    const u = await getDataUrl(id)
    if (u) images[id] = u
  }
  const file: DesignFile = { format: 'stringtheory-design', version: 1, design: d, images }
  return new Blob([JSON.stringify(file)], { type: 'application/json' })
}

export async function importDesignFile(text: string): Promise<Design> {
  const f = JSON.parse(text) as DesignFile | Design
  const design = 'format' in f ? f.design : (f as Design)
  if ('format' in f) for (const [id, url] of Object.entries(f.images)) await putImage(url, id)
  return upgrade(design)
}

// ------------------------------------------------------------------ share links

function b64url(bytes: Uint8Array) {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function unb64url(s: string) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}

async function pump(stream: ReadableStream<Uint8Array>) {
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function shareLink(d: Design): Promise<{ url: string; droppedImages: number }> {
  const slim: Design = { ...d, decals: [], bom: { ...d.bom, overrides: {} } }
  if (slim.inlays.pattern === 'image' || slim.inlays.pattern === 'spanning-image') slim.inlays = { ...slim.inlays, pattern: 'dots', imageId: undefined }
  const json = new TextEncoder().encode(JSON.stringify(slim))
  const zipped = await pump(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw')))
  const base = location.href.split('#')[0]
  return { url: `${base}#d=${b64url(zipped)}`, droppedImages: d.decals.length + (d.inlays.imageId ? 1 : 0) }
}

export async function designFromHash(): Promise<Design | null> {
  const m = location.hash.match(/#d=([A-Za-z0-9_-]+)/)
  if (!m) return null
  try {
    const bytes = unb64url(m[1])
    const out = await pump(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')))
    return upgrade(JSON.parse(new TextDecoder().decode(out)))
  } catch {
    return null
  }
}

export function download(name: string, blob: Blob | string) {
  const a = document.createElement('a')
  a.href = typeof blob === 'string' ? blob : URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (typeof blob !== 'string') setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'guitar'
}
