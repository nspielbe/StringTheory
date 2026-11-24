import { get, set, del, keys, createStore } from 'idb-keyval'
import { uid } from './geometry'

// User images (decals, inlay art, tracing references) live in IndexedDB as
// data URLs; designs only reference them by id.

const store = createStore('stringtheory-images', 'images')
const loaded = new Map<string, HTMLImageElement>()
const loading = new Map<string, Promise<HTMLImageElement | null>>()
const listeners = new Set<() => void>()

export function onImagesChanged(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  listeners.forEach((f) => f())
}

export async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

/** Downscale very large uploads so designs stay light. */
async function normalise(dataUrl: string, max = 2048): Promise<string> {
  const img = await loadImg(dataUrl)
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  if (s >= 1 && dataUrl.length < 3_000_000) return dataUrl
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * s)
  c.height = Math.round(img.naturalHeight * s)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/png')
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })
}

export async function putImage(src: Blob | string, id = uid('img')): Promise<string> {
  const raw = typeof src === 'string' ? src : await fileToDataUrl(src)
  const dataUrl = await normalise(raw)
  await set(id, dataUrl, store)
  loaded.set(id, await loadImg(dataUrl))
  emit()
  return id
}

export async function getDataUrl(id: string): Promise<string | undefined> {
  return get<string>(id, store)
}

export function getLoadedImage(id: string): HTMLImageElement | null {
  return loaded.get(id) ?? null
}

export function loadImage(id: string): Promise<HTMLImageElement | null> {
  const l = loaded.get(id)
  if (l) return Promise.resolve(l)
  let p = loading.get(id)
  if (!p) {
    p = getDataUrl(id).then(async (u) => {
      if (!u) return null
      const img = await loadImg(u)
      loaded.set(id, img)
      emit()
      return img
    })
    loading.set(id, p)
  }
  return p
}

export async function listImageIds(): Promise<string[]> {
  return (await keys(store)) as string[]
}

export async function deleteImage(id: string) {
  await del(id, store)
  loaded.delete(id)
  emit()
}

/** Built-in sample art so people can try decals without uploading anything. */
export function sampleArt(kind: 'logo' | 'flames' | 'stars' | 'tree'): string {
  // 'tree' is a tall vine sized for full-board inlays
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 512
  const g = c.getContext('2d')!
  g.clearRect(0, 0, 512, 512)
  if (kind === 'logo') {
    g.fillStyle = '#ffffff'
    g.font = 'italic 700 150px Georgia, serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('ST', 256, 230)
    g.font = '600 46px Georgia, serif'
    g.fillText('STRINGTHEORY', 256, 350)
  } else if (kind === 'flames') {
    const grd = g.createLinearGradient(0, 512, 0, 0)
    grd.addColorStop(0, '#ffe14d')
    grd.addColorStop(0.5, '#ff7b1c')
    grd.addColorStop(1, '#c0170f')
    g.fillStyle = grd
    for (let i = 0; i < 9; i++) {
      const x = 30 + i * 56
      g.beginPath()
      g.moveTo(x - 40, 512)
      g.bezierCurveTo(x - 60, 300, x + 40, 260, x + 10 * Math.sin(i), 60 + (i % 3) * 50)
      g.bezierCurveTo(x + 30, 260, x + 70, 330, x + 40, 512)
      g.fill()
    }
  } else if (kind === 'stars') {
    g.fillStyle = '#ffffff'
    for (let i = 0; i < 26; i++) {
      const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 480 + 16
      const y = (Math.sin(i * 78.233) * 0.5 + 0.5) * 480 + 16
      const r = 8 + (i % 5) * 7
      g.beginPath()
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 - Math.PI / 2
        const rr = k % 2 ? r * 0.45 : r
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
      }
      g.fill()
    }
  } else {
    // tall vine for full-length fretboard inlays
    c.width = 360
    c.height = 2000
    g.clearRect(0, 0, c.width, c.height)
    g.strokeStyle = '#ffffff'
    g.fillStyle = '#ffffff'
    g.lineCap = 'round'
    g.lineWidth = 22
    g.beginPath()
    for (let y = 1980; y >= 20; y -= 10) {
      const x = 180 + Math.sin(y / 170) * 70
      if (y === 1980) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
    for (let i = 0; i < 16; i++) {
      const y = 1880 - i * 115
      const x = 180 + Math.sin(y / 170) * 70
      const side = i % 2 ? 1 : -1
      g.lineWidth = 12
      g.beginPath()
      g.moveTo(x, y)
      g.quadraticCurveTo(x + side * 60, y - 20, x + side * 95, y - 70)
      g.stroke()
      g.save()
      g.translate(x + side * 105, y - 85)
      g.rotate(side * 0.7)
      g.beginPath()
      g.ellipse(0, 0, 26, 52, 0, 0, Math.PI * 2)
      g.fill()
      g.restore()
    }
  }
  return c.toDataURL('image/png')
}
