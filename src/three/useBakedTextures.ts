import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Design } from '../types'
import { bakeBodyFace, bakeFretboard, bakeHeadFace, bakeNeckWood, bakePickguard, bakeSides, headFinish, type Baked, type Space } from '../lib/bake'
import { loadImage, onImagesChanged } from '../lib/imageStore'

export type Zone = 'top' | 'back' | 'sides' | 'neck' | 'head' | 'fretboard' | 'guard'

export interface ZoneTex {
  texture: THREE.CanvasTexture
  space: Space
  version: number
}

const decalSig = (d: Design, zone: string) => d.decals.filter((x) => x.zone === zone)

export function zoneSignatures(d: Design): Record<Zone, string> {
  const shape = [d.body.shapeId, d.body.custom?.points, d.neck.nutWidth, d.neck.taper, d.scale, d.frets]
  const b = d.body
  return {
    top: JSON.stringify([shape, b.top, b.wood, b.seed, b.figure, b.pieces, b.top.enabled ? d.finish.top : d.finish.body, b.binding, d.neck.construction, d.neck.wood, d.neck.seed, decalSig(d, 'top')]),
    back: JSON.stringify([shape, b.wood, b.seed, b.figure, b.pieces, d.finish.body, d.neck.construction, d.neck.wood, d.neck.seed, decalSig(d, 'back')]),
    sides: JSON.stringify([shape, b.thickness, b.top, b.wood, b.seed, b.figure, d.finish.body, d.finish.top, b.binding]),
    neck: JSON.stringify([d.neck.wood, d.neck.seed, d.finish.neck]),
    head: JSON.stringify([d.headstock, d.neck.nutWidth, d.strings, d.neck.wood, d.neck.seed, b.top.enabled, b.top.wood, b.figure, headFinish(d), d.finish.neck, decalSig(d, 'headstock')]),
    fretboard: JSON.stringify([d.scale, d.frets, d.neck.nutWidth, d.neck.taper, d.neck.fretboardWood, d.neck.seed, d.inlays, d.neck.fretboardBinding, d.finish.fretboard]),
    guard: JSON.stringify([d.pickguard, shape, decalSig(d, 'pickguard')]),
  }
}

const BAKERS: Record<Zone, (d: Design) => Promise<Baked | null>> = {
  top: (d) => bakeBodyFace(d, 'top'),
  back: (d) => bakeBodyFace(d, 'back'),
  sides: bakeSides,
  neck: bakeNeckWood,
  head: bakeHeadFace,
  fretboard: bakeFretboard,
  guard: bakePickguard,
}

/** Texture transform so geometry with raw-mm UVs samples the baked space correctly. */
export function applySpace(tex: THREE.Texture, sp: Space) {
  tex.repeat.set(sp.s / sp.W, sp.s / sp.H)
  tex.offset.set((-sp.minX * sp.s) / sp.W, 1 - (sp.maxY * sp.s) / sp.H)
}

export function useBakedTextures(d: Design, maxAniso: number) {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<Partial<Record<Zone, ZoneTex | null>>>({})
  const gen = useRef<Record<string, number>>({})
  const texRef = useRef<Partial<Record<Zone, THREE.CanvasTexture>>>({})
  const latest = useRef(d)
  latest.current = d

  useEffect(() => {
    const off = onImagesChanged(() => setTick((t) => t + 1))
    return () => {
      off()
    }
  }, [])
  // make sure every referenced image is loading
  useEffect(() => {
    d.decals.forEach((x) => loadImage(x.imageId))
    if (d.inlays.imageId) loadImage(d.inlays.imageId)
  }, [d.decals, d.inlays.imageId])

  const sigs = useMemo(() => zoneSignatures(d), [d])

  const run = (zone: Zone, delay: number) => {
    const g = (gen.current[zone] = (gen.current[zone] ?? 0) + 1)
    const timer = setTimeout(async () => {
      const baked = await BAKERS[zone](latest.current)
      if (gen.current[zone] !== g) return
      if (!baked) {
        setState((s) => ({ ...s, [zone]: null }))
        return
      }
      let tex = texRef.current[zone]
      if (!tex || tex.image.width !== baked.canvas.width || tex.image.height !== baked.canvas.height) {
        tex?.dispose()
        tex = new THREE.CanvasTexture(baked.canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = maxAniso
        tex.wrapS = tex.wrapT = zone === 'neck' ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
        texRef.current[zone] = tex
      } else {
        tex.image = baked.canvas
      }
      if (zone !== 'neck' && zone !== 'sides') applySpace(tex, baked.space)
      tex.needsUpdate = true
      setState((s) => ({ ...s, [zone]: { texture: tex!, space: baked.space, version: g } }))
      if (import.meta.env.DEV) ((window as unknown as { __tex: unknown }).__tex = texRef.current)
    }, delay)
    return () => clearTimeout(timer)
  }

  useEffect(() => run('top', 60), [sigs.top, tick])
  useEffect(() => run('back', 90), [sigs.back, tick])
  useEffect(() => run('sides', 120), [sigs.sides])
  useEffect(() => run('neck', 60), [sigs.neck])
  useEffect(() => run('head', 70), [sigs.head, tick])
  useEffect(() => run('fretboard', 70), [sigs.fretboard, tick])
  useEffect(() => run('guard', 80), [sigs.guard, tick])

  useEffect(
    () => () => {
      Object.values(texRef.current).forEach((t) => t?.dispose())
    },
    [],
  )
  return state
}
