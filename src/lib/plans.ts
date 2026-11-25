import { planUrl, type Box, type Plan } from '../data/plans'

export interface PlanImage {
  /** Object URL of the cropped SVG. */
  url: string
  /** Region of the drawing the image shows, in the SVG's user units. */
  box: Box
}

const cache = new Map<string, Promise<PlanImage>>()

/** The drawing's box with a small margin so edge strokes aren't clipped. */
export function paddedBox(p: Plan, frac = 0.02): Box {
  const [x, y, w, h] = p.box
  const pad = Math.max(w, h) * frac
  return [x - pad, y - pad, w + pad * 2, h + pad * 2]
}

/**
 * Swap the root <svg> viewBox for `box` and size it in millimetres. Only the root tag
 * changes; the drawing itself is untouched. (Chrome mispositions `#svgView(viewBox())`
 * fragments when the new box has a different aspect from the page, so we rewrite instead.)
 */
export function cropSvg(text: string, box: Box, mmPerUnit: number): string {
  const m = /<svg\b[^>]*>/.exec(text)
  if (!m) throw new Error('Not an SVG file')
  const [x, y, w, h] = box
  const tag = m[0].replace(/\s(viewBox|width|height|preserveAspectRatio)="[^"]*"/g, '').replace(/\s*\/?>$/, '')
  const sized = `${tag} viewBox="${x} ${y} ${w} ${h}" width="${(w * mmPerUnit).toFixed(2)}mm" height="${(h * mmPerUnit).toFixed(2)}mm" preserveAspectRatio="xMidYMid meet">`
  return text.slice(0, m.index) + sized + text.slice(m.index + m[0].length)
}

/**
 * Load a plan as an image cropped to its drawing. Most plans sit in a corner of a
 * 24" laser sheet, and a few are drawn entirely off their page, so showing the file's
 * own page would leave them tiny or blank.
 */
export function loadPlanImage(p: Plan): Promise<PlanImage> {
  let hit = cache.get(p.id)
  if (!hit) {
    hit = (async () => {
      const res = await fetch(planUrl(p))
      if (!res.ok) throw new Error(`Could not load ${p.file} (${res.status})`)
      const box = paddedBox(p)
      const svg = cropSvg(await res.text(), box, p.mmPerUnit)
      return { url: URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), box }
    })()
    hit.catch(() => cache.delete(p.id))
    cache.set(p.id, hit)
  }
  return hit
}

export const formatBytes = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`)
