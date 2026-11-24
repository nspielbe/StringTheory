import { wood } from '../data/woods'
import type { WoodGenRequest } from './woodGen'

// Wood tiles are generated off the main thread and cached by species/seed.

type Pending = { resolve: (c: HTMLCanvasElement) => void }

const workers: Worker[] = []
const pending = new Map<number, Pending>()
let nextId = 1
let rr = 0

function getWorker(): Worker {
  if (!workers.length) {
    const n = Math.min(3, Math.max(1, (navigator.hardwareConcurrency || 4) - 1))
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('../workers/wood.worker.ts', import.meta.url), { type: 'module' })
      w.onmessage = (e: MessageEvent<{ id: number; width: number; height: number; data: Uint8ClampedArray }>) => {
        const { id, width, height, data } = e.data
        const c = document.createElement('canvas')
        c.width = width
        c.height = height
        c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0)
        pending.get(id)?.resolve(c)
        pending.delete(id)
      }
      workers.push(w)
    }
  }
  rr = (rr + 1) % workers.length
  return workers[rr]
}

export type TileKind = 'board' | 'long' | 'small'

const SIZES: Record<TileKind, { w: number; h: number; ppm: number }> = {
  board: { w: 240, h: 520, ppm: 3.2 },
  long: { w: 90, h: 1000, ppm: 3.2 },
  small: { w: 120, h: 240, ppm: 4 },
}

const cache = new Map<string, Promise<HTMLCanvasElement>>()

export function woodTile(woodId: string, seed: number, figure: number, kind: TileKind): Promise<HTMLCanvasElement> {
  const key = `${woodId}|${seed}|${figure.toFixed(2)}|${kind}`
  let p = cache.get(key)
  if (p) return p
  const s = SIZES[kind]
  const req: WoodGenRequest = { look: wood(woodId).look, seed, figure, widthMm: s.w, heightMm: s.h, pxPerMm: s.ppm }
  p = new Promise<HTMLCanvasElement>((resolve) => {
    const id = nextId++
    pending.set(id, { resolve })
    getWorker().postMessage({ id, req })
  })
  cache.set(key, p)
  if (cache.size > 60) cache.delete(cache.keys().next().value!)
  return p
}

export const TILE_SIZES = SIZES

/** Tiny flat-colour stand-in while the real tile is generating. */
export function woodSwatch(woodId: string): string {
  const l = wood(woodId).look
  return l.light
}
