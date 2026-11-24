import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Design, Vec2 } from '../types'
import { buildBody } from './bodyGeometry'
import { buildFretboard, buildHeadstock, buildNeckShaft, fbSurface } from './neckGeometry'
import { useBakedTextures } from './useBakedTextures'
import { FRET_MATS, STRING_MAT, WOUND_MAT, finishProps, hardwareMat, plasticMat } from './materials'
import { Bridge, Jack, Knob, Pickup, StrapButton, Switch, Tuner, Box } from './Hardware'
import { fretboardEndY, neckFrame, neckWidthAt, pickguardPoints, placePickups, resolveBody, resolveHeadstock, stringLines, PICKUP_DIMS } from '../lib/layout'
import { ensureCCW, fretY, pointInPolygon, sampleOutline } from '../lib/geometry'
import { headFinish } from '../lib/bake'
import { wood } from '../data/woods'
import { GUARDS } from '../lib/patterns'

export interface GuitarInfo {
  minY: number
  maxY: number
  bodyCenterY: number
  headCenterY: number
  volumeMm3: number
}

function nearestOnOutline(outline: Vec2[], p: Vec2) {
  let best = 0
  let bd = Infinity
  for (let i = 0; i < outline.length; i++) {
    const d = (outline[i].x - p.x) ** 2 + (outline[i].y - p.y) ** 2
    if (d < bd) {
      bd = d
      best = i
    }
  }
  const a = outline[(best - 2 + outline.length) % outline.length]
  const b = outline[(best + 2) % outline.length]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l = Math.hypot(dx, dy) || 1
  // outward normal for a CCW outline
  return { point: outline[best], normal: { x: dy / l, y: -dx / l } }
}

function physical(map: THREE.Texture | undefined, props: Partial<THREE.MeshPhysicalMaterialParameters>, fallback: string) {
  return new THREE.MeshPhysicalMaterial({ map: map ?? null, color: map ? '#ffffff' : fallback, ...props })
}

export function Guitar({ d, showStrings, showHardware, onInfo }: { d: Design; showStrings: boolean; showHardware: boolean; onInfo?: (i: GuitarInfo) => void }) {
  const gl = useThree((s) => s.gl)
  const tex = useBakedTextures(d, Math.min(8, gl.capabilities.getMaxAnisotropy()))
  const bodySig = JSON.stringify([d.body.shapeId, d.body.custom?.points, d.body.thickness, d.body.edgeRadius, d.body.backRadius, d.body.chamfer, d.body.armContour, d.body.bellyCut, d.body.top.enabled, d.body.top.carved, d.body.top.carveHeight, d.body.top.carveWidth, d.body.top.recurve, d.neck.nutWidth, d.neck.taper, d.scale, d.frets])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const body = useMemo(() => buildBody(d), [bodySig])
  const neckSig = JSON.stringify([bodySig, d.neck, d.headstock.thickness, d.strings])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const frame = useMemo(() => neckFrame(d, body.topZ), [neckSig, body])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shaft = useMemo(() => buildNeckShaft(d, frame, body.backZ), [neckSig, frame])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fb = useMemo(() => buildFretboard(d, frame), [neckSig, frame])
  const hsSig = JSON.stringify([d.headstock, d.neck.nutWidth, d.strings])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hs = useMemo(() => resolveHeadstock(d), [hsSig])
  const head = useMemo(() => buildHeadstock(hs.outline, d.headstock.thickness), [hs, d.headstock.thickness])
  const rb = resolveBody(d)

  const L = d.scale
  const headAngle = (d.headstock.angle * Math.PI) / 180
  const zFace = frame.neckTop(L) - (d.headstock.angle === 0 ? 1.2 : 0)
  const topFin = d.body.top.enabled ? d.finish.top : d.finish.body

  const mats = useMemo(() => {
    const top = physical(tex.top?.texture, finishProps(topFin), wood(d.body.top.enabled ? d.body.top.wood : d.body.wood).look.light)
    const back = physical(tex.back?.texture, finishProps(d.finish.body), wood(d.body.wood).look.light)
    const side = physical(tex.sides?.texture, finishProps(d.finish.body), wood(d.body.wood).look.dark)
    const neck = physical(tex.neck?.texture, finishProps(d.finish.neck), wood(d.neck.wood).look.light)
    const hf = headFinish(d) ?? d.finish.neck
    const headFace = physical(tex.head?.texture, finishProps(hf), wood(d.headstock.veneer ?? d.neck.wood).look.light)
    const fbm = physical(tex.fretboard?.texture, d.finish.fretboard === 'oil' ? { roughness: 0.62 } : { roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.08 }, wood(d.neck.fretboardWood).look.dark)
    const fbSide = new THREE.MeshPhysicalMaterial({ color: d.neck.fretboardBinding.enabled ? d.neck.fretboardBinding.color : wood(d.neck.fretboardWood).look.dark, roughness: 0.5 })
    const g = GUARDS[d.pickguard.material]
    const guard = new THREE.MeshPhysicalMaterial({ map: tex.guard?.texture ?? null, color: tex.guard ? '#ffffff' : g.base, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.1, transparent: !!g.clear, opacity: g.clear ? 0.35 : 1 })
    const guardEdge = new THREE.MeshPhysicalMaterial({ color: g.layers[Math.min(1, g.layers.length - 1)], roughness: 0.4, transparent: !!g.clear, opacity: g.clear ? 0.4 : 1 })
    return { top, back, side, neck, headFace, fb: fbm, fbSide, guard, guardEdge }
  }, [tex, topFin, d])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  // pickguard
  const guardPts = useMemo(() => {
    const p = pickguardPoints(d)
    return p ? ensureCCW(sampleOutline(p, 2)) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([d.pickguard, d.body.shapeId, d.neck.nutWidth, d.neck.taper, d.scale, d.frets])])
  const pickups = placePickups(d)
  const guardZ = guardPts ? body.topZ(0, 110) + 0.15 : 0
  const guardTop = guardZ + 2.4
  const guardGeo = useMemo(() => {
    if (!guardPts) return null
    const shape = new THREE.Shape(guardPts.map((p) => new THREE.Vector2(p.x, p.y)))
    for (const p of pickups) {
      if (!pointInPolygon(p.x, p.y, guardPts) || p.slot.type === 'tele-bridge') continue
      const dim = PICKUP_DIMS[p.slot.type]
      const w = (p.slot.type === 'single' || p.slot.type === 'single-hb' ? 72 : dim.w) / 2 + 1
      const h = dim.h / 2 + 1
      const c = Math.cos(p.rot)
      const s = Math.sin(p.rot)
      const corners = [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => new THREE.Vector2(p.x + x * c - y * s, p.y + x * s + y * c))
      shape.holes.push(new THREE.Path(corners.reverse()))
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.4, bevelSegments: 1, curveSegments: 2 })
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardPts, JSON.stringify(pickups.map((p) => [p.y, p.rot, p.slot.type]))])

  const strings = stringLines(d)
  const saddleZ = frame.saddleZ
  const z0Bridge = body.topZ(0, -10)
  const nutTop = frame.fbTop(L) + 1.6
  const headless = hs.mode === 'none'
  const lightPlastic = d.pickguard.enabled && ['white', 'cream', 'mint', 'pearloid', 'wbw'].includes(d.pickguard.material)

  // headstock local -> world
  const toWorld = (x: number, y: number, z: number) => new THREE.Vector3(x, L + y * Math.cos(headAngle) + z * Math.sin(headAngle), zFace - y * Math.sin(headAngle) + z * Math.cos(headAngle))

  const stringGeo = useMemo(() => {
    if (!showStrings) return null
    const segs: THREE.BufferGeometry[] = []
    const segW: THREE.BufferGeometry[] = []
    const tailFor = (bx: number) => {
      switch (d.hardware.bridge) {
        case 'tom': return new THREE.Vector3(bx * 1.03, -62, z0Bridge + 13)
        case 'floyd': return new THREE.Vector3(bx, -24, saddleZ - 1.5)
        case 'tele': return new THREE.Vector3(bx, -42, z0Bridge + 2)
        case 'headless-fixed':
        case 'headless-trem': return new THREE.Vector3(bx, -56, saddleZ - 2)
        default: return new THREE.Vector3(bx, -30, z0Bridge + 4)
      }
    }
    strings.forEach((s, i) => {
      const pts: THREE.Vector3[] = [tailFor(s.bridgeX), new THREE.Vector3(s.bridgeX, -2, saddleZ), new THREE.Vector3(s.nutX, L + 1, nutTop)]
      if (headless) pts.push(new THREE.Vector3(s.nutX, L + 16, nutTop + 1))
      else {
        const post = hs.posts[i]
        if (post) pts.push(toWorld(post.x, post.y, 8))
      }
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k]
        const b = pts[k + 1]
        const len = a.distanceTo(b)
        const g = new THREE.CylinderGeometry(s.gauge / 2, s.gauge / 2, len, 6, 1, true)
        g.translate(0, len / 2, 0)
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
        g.applyQuaternion(q)
        g.translate(a.x, a.y, a.z)
        ;(s.wound ? segW : segs).push(g)
      }
    })
    return { plain: mergeAll(segs), wound: mergeAll(segW) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStrings, JSON.stringify(strings), saddleZ, nutTop, hs, headAngle, zFace, d.hardware.bridge, z0Bridge, headless])

  const controls = rb.shape.controls
  const knobN = Math.min(4, d.electronics.volumes + d.electronics.tones)
  const onGuard = (p: Vec2) => !!guardPts && pointInPolygon(p.x, p.y, guardPts)
  const jack = nearestOnOutline(rb.outline, controls.jack)
  const yEnd = fretboardEndY(d)
  const sideDotFrets = d.inlays.sideDots ? d.inlays.frets.filter((n) => n <= d.frets) : []
  const sideDotMat = plasticMat(d.inlays.sideDotMaterial === 'black' ? '#111111' : d.inlays.sideDotMaterial === 'glow' ? '#c9f5d8' : '#f4f1e8', 0.4)
  const fretMat = d.neck.fretWire === 'stainless' ? FRET_MATS.stainless : d.neck.fretWire === 'gold' ? FRET_MATS.gold : FRET_MATS.nickel
  const nutMat = plasticMat({ bone: '#efe6cf', 'bone-bleached': '#f7f4ec', tusq: '#f4f2ec', 'tusq-black': '#1a1a1a', 'black-bone': '#151515' }[d.neck.nut], 0.45)

  useEffect(() => {
    onInfo?.({
      minY: rb.bounds.minY,
      maxY: L + hs.bounds.maxY * Math.cos(headAngle),
      bodyCenterY: (rb.bounds.minY + rb.bounds.maxY) / 2,
      headCenterY: L + (hs.bounds.maxY / 2) * Math.cos(headAngle),
      volumeMm3: body.volumeMm3,
    })
  }, [rb.bounds, hs.bounds, headAngle, L, onInfo, body.volumeMm3])

  return (
    <group>
      {/* body */}
      <mesh geometry={body.top} material={mats.top} castShadow receiveShadow />
      <mesh geometry={body.back} material={mats.back} castShadow receiveShadow />
      <mesh geometry={body.side} material={mats.side} castShadow receiveShadow />
      {/* neck */}
      <mesh geometry={shaft} material={mats.neck} castShadow />
      <mesh geometry={fb.top} material={mats.fb} castShadow receiveShadow />
      <mesh geometry={fb.sides} material={mats.fbSide} />
      <mesh geometry={fb.frets} material={fretMat} castShadow />
      {sideDotFrets.map((n) => {
        const y = (fretY(L, n - 1) + fretY(L, n)) / 2
        const w = neckWidthAt(d, y) / 2
        const z = fbSurface(d, frame, -w, y) - 2.6
        const pair = d.inlays.doubleAt12 && (n === 12 || n === 24)
        return (pair ? [y + 4, y - 4] : [y]).map((yy, k) => (
          <mesh key={n + '-' + k} position={[-w - 0.05, yy, z]} rotation={[0, 0, Math.PI / 2]} material={sideDotMat}>
            <cylinderGeometry args={[1.1, 1.1, 0.4, 12]} />
          </mesh>
        ))
      })}
      {/* nut */}
      {!headless && <Box p={[0, L + 2.6, (frame.neckTop(L) + nutTop) / 2]} s={[d.neck.nutWidth, 5, nutTop - frame.neckTop(L)]} m={nutMat} />}
      {d.hardware.bridge === 'floyd' && <Box p={[0, L + 16, nutTop + 1]} s={[d.neck.nutWidth + 2, 14, 8]} m={hardwareMat(d.hardware.color)} />}
      {/* headstock */}
      <group position={[0, L, zFace]} rotation={[-headAngle, 0, 0]}>
        <mesh geometry={head.body} material={mats.neck} castShadow />
        <mesh geometry={head.face} material={mats.headFace} />
        {showHardware &&
          hs.posts.map((p, i) => (
            <Tuner key={i} x={p.x} y={p.y} side={hs.buttonSide[i]} thickness={d.headstock.thickness} hw={d.hardware.color} locking={d.hardware.tunerProductId.includes('griplock')} />
          ))}
        {showHardware && headless && <Box p={[0, 14, 6]} s={[d.neck.nutWidth + 10, 22, 12]} m={hardwareMat(d.hardware.color)} />}
      </group>
      {/* pickguard */}
      {guardGeo && <mesh geometry={guardGeo} material={[mats.guard, mats.guardEdge]} position={[0, 0, guardZ]} castShadow receiveShadow />}
      {showHardware && (
        <group>
          {pickups.map((p) => (
            <Pickup key={p.index} p={p} z0={onGuard(p) ? guardTop : body.topZ(p.x, p.y) + 0.2} strings={d.strings} hw={d.hardware.color} guard={onGuard(p)} />
          ))}
          <Bridge d={d} z0={z0Bridge} saddleZ={saddleZ} xs={strings.map((s) => s.bridgeX)} />
          {controls.knobs.slice(0, knobN).map((k, i) => (
            <Knob key={i} p={[k.x, k.y, onGuard(k) ? guardTop : body.topZ(k.x, k.y)]} style={d.electronics.knobStyle} hw={d.hardware.color} light={lightPlastic} />
          ))}
          <Switch p={[controls.switch.x, controls.switch.y, onGuard(controls.switch) ? guardTop : body.topZ(controls.switch.x, controls.switch.y)]} type={d.electronics.switchType} hw={d.hardware.color} light={lightPlastic} angle={-0.5} />
          {d.electronics.jack === 'strat-plate' ? (
            <Jack p={controls.jack} normal={{ x: Math.cos((controls.jackAngle * Math.PI) / 180), y: Math.sin((controls.jackAngle * Math.PI) / 180) }} type="strat-plate" hw={d.hardware.color} z={body.topZ(controls.jack.x, controls.jack.y)} />
          ) : (
            <Jack p={jack.point} normal={jack.normal} type={d.electronics.jack} hw={d.hardware.color} z={d.body.thickness / 2} />
          )}
          {rb.shape.strapButtons.map((s, i) => {
            const n = nearestOnOutline(rb.outline, s)
            return <StrapButton key={i} p={n.point} normal={n.normal} z={d.body.thickness / 2} hw={d.hardware.color} />
          })}
          {d.neck.construction === 'bolt-on' && <Box p={[0, Math.max(yEnd + 30, rb.neckPocketY - 36), body.backZ(0, rb.neckPocketY - 36) - 0.6]} s={[50, 64, 1.2]} m={hardwareMat(d.hardware.color)} />}
        </group>
      )}
      {stringGeo?.plain && <mesh geometry={stringGeo.plain} material={STRING_MAT} />}
      {stringGeo?.wound && <mesh geometry={stringGeo.wound} material={WOUND_MAT} />}
    </group>
  )
}

function mergeAll(gs: THREE.BufferGeometry[]) {
  if (!gs.length) return null
  const total = gs.reduce((n, g) => n + (g.index ? g.index.count : g.getAttribute('position').count), 0)
  const pos: number[] = []
  const idx: number[] = []
  let off = 0
  for (const g of gs) {
    const p = g.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i))
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + off)
    off += p.count
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setIndex(idx)
  out.computeVertexNormals()
  void total
  return out
}
