import { useMemo } from 'react'
import * as THREE from 'three'
import type { Design, PickupSlot } from '../types'
import type { PlacedPickup } from '../lib/layout'
import { hardwareMat, plasticMat } from './materials'

// Simplified but recognisable hardware. Units: mm, z up out of the top.

type V3 = [number, number, number]

export function Box({ p, s, m, r }: { p: V3; s: V3; m: THREE.Material; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} material={m} castShadow>
      <boxGeometry args={s} />
    </mesh>
  )
}

/** Cylinder standing on z. */
export function Post({ p, r, h, m, seg = 20 }: { p: V3; r: number; h: number; m: THREE.Material; seg?: number }) {
  return (
    <mesh position={[p[0], p[1], p[2] + h / 2]} rotation={[Math.PI / 2, 0, 0]} material={m} castShadow>
      <cylinderGeometry args={[r, r, h, seg]} />
    </mesh>
  )
}

function RoundedSlab({ w, h, depth, radius, m, p, rot = 0 }: { w: number; h: number; depth: number; radius: number; m: THREE.Material; p: V3; rot?: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    const x = -w / 2, y = -h / 2, r = Math.min(radius, w / 2, h / 2)
    s.moveTo(x + r, y)
    s.lineTo(x + w - r, y)
    s.quadraticCurveTo(x + w, y, x + w, y + r)
    s.lineTo(x + w, y + h - r)
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    s.lineTo(x + r, y + h)
    s.quadraticCurveTo(x, y + h, x, y + h - r)
    s.lineTo(x, y + r)
    s.quadraticCurveTo(x, y, x + r, y)
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: Math.min(0.8, depth * 0.2), bevelThickness: Math.min(0.8, depth * 0.2), bevelSegments: 2, curveSegments: 6 })
  }, [w, h, depth, radius])
  return <mesh geometry={geo} material={m} position={p} rotation={[0, 0, rot]} castShadow />
}

// ------------------------------------------------------------------ bridges

export function Bridge({ d, z0, saddleZ, xs }: { d: Design; z0: number; saddleZ: number; xs: number[] }) {
  const m = hardwareMat(d.hardware.color)
  const n = xs.length
  const span = xs[n - 1] - xs[0]
  const W = span + 22
  const hS = Math.max(2, saddleZ - z0)
  const black = plasticMat('#141414', 0.5)
  switch (d.hardware.bridge) {
    case 'hardtail':
    case 'fixed':
      return (
        <group>
          <RoundedSlab p={[0, -14, z0]} w={W} h={d.hardware.bridge === 'fixed' ? 46 : 52} depth={2.6} radius={6} m={m} />
          <Box p={[0, -36, z0 + 5]} s={[W - 4, 6, 8]} m={m} />
          {xs.map((x, i) => (
            <Box key={i} p={[x, -4, z0 + hS / 2 + 1]} s={[8.6, 20, hS]} m={m} />
          ))}
        </group>
      )
    case 'tom': {
      const tailY = -62
      return (
        <group>
          {[-1, 1].map((s) => (
            <group key={s}>
              <Post p={[s * (W / 2 + 3), 0, z0]} r={3.4} h={hS - 2} m={m} />
              <Post p={[s * (W / 2 + 3), 0, z0]} r={5.2} h={1.6} m={m} />
              <Post p={[s * (W / 2 + 2), tailY, z0]} r={4} h={9} m={m} />
            </group>
          ))}
          <Box p={[0, 0, saddleZ - 4]} s={[W + 10, 11, 6]} m={m} />
          {xs.map((x, i) => (
            <Box key={i} p={[x, 0, saddleZ - 1]} s={[7, 8, 2.4]} m={m} />
          ))}
          <mesh position={[0, tailY, z0 + 10]} rotation={[0, 0, Math.PI / 2]} material={m} castShadow>
            <capsuleGeometry args={[5.2, W + 6, 6, 16]} />
          </mesh>
        </group>
      )
    }
    case 'vintage-trem':
    case 'two-point-trem': {
      const vint = d.hardware.bridge === 'vintage-trem'
      return (
        <group>
          <RoundedSlab p={[0, -18, z0 + 0.2]} w={W + 8} h={50} depth={1.8} radius={vint ? 2 : 10} m={m} />
          {vint && Array.from({ length: n }, (_, i) => <Post key={i} p={[-W / 2 + (i * W) / (n - 1), -38, z0 + 1]} r={2.2} h={1.6} m={m} />)}
          {xs.map((x, i) => (
            <Box key={i} p={[x, -6, z0 + hS / 2 + 1]} s={[vint ? 9.5 : 8.6, vint ? 18 : 20, hS]} m={m} />
          ))}
          <TremArm x={W / 2 + 4} y={-28} z={z0 + 2} m={m} />
        </group>
      )
    }
    case 'floyd':
      return (
        <group>
          <RoundedSlab p={[0, -24, z0 + 1]} w={W + 6} h={66} depth={3} radius={4} m={m} />
          {xs.map((x, i) => (
            <group key={i}>
              <Box p={[x, -10, z0 + hS / 2 + 2]} s={[9.6, 30, hS]} m={m} />
              <Post p={[x, -52, z0 + 4]} r={3.4} h={9} m={m} />
            </group>
          ))}
          <TremArm x={W / 2 + 6} y={-34} z={z0 + 6} m={m} />
        </group>
      )
    case 'tele':
      return (
        <group>
          <RoundedSlab p={[0, 2, z0]} w={86} h={96} depth={1.4} radius={7} m={m} />
          <Box p={[0, -45, z0 + 5]} s={[84, 2, 10]} m={m} />
          <Box p={[-42, -10, z0 + 5]} s={[2, 70, 10]} m={m} />
          <Box p={[42, -10, z0 + 5]} s={[2, 70, 10]} m={m} />
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[(i - 1) * 21.5, -6, saddleZ - 4.5]} rotation={[0, 0, Math.PI / 2]} material={m} castShadow>
              <cylinderGeometry args={[4.5, 4.5, 20, 16]} />
            </mesh>
          ))}
        </group>
      )
    case 'headless-fixed':
    case 'headless-trem':
      return (
        <group>
          <RoundedSlab p={[0, -28, z0]} w={W + 8} h={64} depth={hS + 2} radius={5} m={m} />
          {xs.map((x, i) => (
            <mesh key={i} position={[x, -64, z0 + hS / 2 + 1]} rotation={[0, 0, 0]} material={black} castShadow>
              <cylinderGeometry args={[4.2, 4.2, 12, 14]} />
            </mesh>
          ))}
          {d.hardware.bridge === 'headless-trem' && <TremArm x={W / 2 + 8} y={-30} z={z0 + hS} m={m} />}
        </group>
      )
  }
}

function TremArm({ x, y, z, m }: { x: number; y: number; z: number; m: THREE.Material }) {
  const geo = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(10, -20, 26),
      new THREE.Vector3(30, -90, 32),
      new THREE.Vector3(40, -140, 34),
    ])
    return new THREE.TubeGeometry(c, 40, 2.2, 8, false)
  }, [])
  return <mesh geometry={geo} material={m} position={[x, y, z]} castShadow />
}

// ------------------------------------------------------------------ pickups

const coverColor: Record<PickupSlot['cover'], string> = {
  black: '#121212',
  zebra: '#121212',
  'reverse-zebra': '#efe5c8',
  nickel: '#d9d0bf',
  gold: '#e3bb63',
  chrome: '#eef0f2',
  white: '#f2efe6',
  cream: '#ecdcb0',
}

export function Pickup({ p, z0, strings, hw, guard }: { p: PlacedPickup; z0: number; strings: number; hw: Design['hardware']['color']; guard: boolean }) {
  const { slot } = p
  const metal = slot.cover === 'nickel' || slot.cover === 'gold' || slot.cover === 'chrome'
  const mCover = metal ? hardwareMat(slot.cover === 'gold' ? 'gold' : slot.cover === 'nickel' ? 'nickel' : 'chrome') : plasticMat(coverColor[slot.cover], 0.45)
  const pole = hardwareMat(hw === 'gold' ? 'gold' : 'nickel')
  const n = strings
  const span = 52 * (strings === 7 ? 1.18 : 1)
  const poles = Array.from({ length: n }, (_, i) => -span / 2 + (span * i) / (n - 1))
  const h = 9
  const ring = !guard && slot.type === 'humbucker'
  const black = plasticMat('#111111', 0.5)
  const zb = z0
  return (
    <group position={[p.x, p.y, 0]} rotation={[0, 0, p.rot]}>
      {ring && (
        <group>
          <Box p={[0, 20.5, zb + 2]} s={[p.w + 18, 6, 4]} m={black} />
          <Box p={[0, -20.5, zb + 2]} s={[p.w + 18, 6, 4]} m={black} />
          <Box p={[p.w / 2 + 6, 0, zb + 2]} s={[6, 36, 4]} m={black} />
          <Box p={[-p.w / 2 - 6, 0, zb + 2]} s={[6, 36, 4]} m={black} />
        </group>
      )}
      {slot.type === 'humbucker' &&
        (metal ? (
          <group>
            <RoundedSlab p={[0, 0, zb]} w={p.w} h={38} depth={h} radius={3} m={mCover} />
            {poles.map((x, i) => (
              <Post key={i} p={[x, 9, zb + h + 0.6]} r={2.1} h={0.8} m={pole} />
            ))}
          </group>
        ) : (
          <group>
            <RoundedSlab p={[0, 9.5, zb]} w={p.w - 2} h={17} depth={h} radius={2.5} m={slot.cover === 'zebra' ? plasticMat('#ece2c4', 0.45) : mCover} />
            <RoundedSlab p={[0, -9.5, zb]} w={p.w - 2} h={17} depth={h} radius={2.5} m={slot.cover === 'reverse-zebra' ? plasticMat('#121212', 0.45) : mCover} />
            {poles.map((x, i) => (
              <group key={i}>
                <Post p={[x, 9.5, zb + h + 0.6]} r={2.3} h={0.9} m={pole} />
                <Post p={[x, -9.5, zb + h + 0.6]} r={2.3} h={0.5} m={pole} />
              </group>
            ))}
          </group>
        ))}
      {(slot.type === 'single' || slot.type === 'single-hb' || slot.type === 'tele-bridge') && (
        <group>
          <RoundedSlab p={[0, 0, zb]} w={slot.type === 'tele-bridge' ? 70 : 70} h={18} depth={h + 2} radius={8.5} m={mCover} />
          {slot.type !== 'tele-bridge' && <RoundedSlab p={[0, 0, zb]} w={83} h={10} depth={1.2} radius={4} m={mCover} />}
          {slot.type === 'single-hb'
            ? [-3, 3].map((y) => <Box key={y} p={[0, y, zb + h + 2.7]} s={[span + 6, 2.4, 1.4]} m={pole} />)
            : poles.map((x, i) => <Post key={i} p={[x, 0, zb + h + 2]} r={2.4} h={0.6 + (i % 3 === 1 ? 0.6 : 0)} m={pole} />)}
        </group>
      )}
      {slot.type === 'p90' && (
        <group>
          <RoundedSlab p={[0, 0, zb]} w={86} h={35} depth={h} radius={6} m={mCover} />
          {poles.map((x, i) => (
            <Post key={i} p={[x, 0, zb + h + 0.6]} r={2.5} h={0.6} m={pole} />
          ))}
        </group>
      )}
    </group>
  )
}

// ------------------------------------------------------------------ controls

export function Knob({ p, style, hw, light }: { p: V3; style: Design['electronics']['knobStyle']; hw: Design['hardware']['color']; light: boolean }) {
  const metal = hardwareMat(hw)
  const plastic = plasticMat(light ? '#efeadf' : '#151515', 0.35)
  const [x, y, z] = p
  switch (style) {
    case 'strat':
      return (
        <group position={[x, y, z]}>
          <Post p={[0, 0, 0]} r={12.5} h={3} m={plastic} seg={28} />
          <mesh position={[0, 0, 9]} rotation={[Math.PI / 2, 0, 0]} material={plastic} castShadow>
            <cylinderGeometry args={[8.5, 10.5, 12, 24]} />
          </mesh>
        </group>
      )
    case 'tophat':
      return (
        <group position={[x, y, z]}>
          <Post p={[0, 0, 0]} r={13.5} h={2.5} m={plastic} seg={28} />
          <mesh position={[0, 0, 10]} rotation={[Math.PI / 2, 0, 0]} material={plastic} castShadow>
            <cylinderGeometry args={[10.5, 11.5, 16, 24]} />
          </mesh>
          <Post p={[0, 0, 18]} r={8} h={0.4} m={hardwareMat('gold')} seg={24} />
        </group>
      )
    case 'speed':
      return (
        <group position={[x, y, z]}>
          <mesh position={[0, 0, 7]} rotation={[Math.PI / 2, 0, 0]} material={plasticMat('#b98a2c', 0.3)} castShadow>
            <cylinderGeometry args={[10, 11.5, 14, 24]} />
          </mesh>
        </group>
      )
    case 'dome':
      return (
        <group position={[x, y, z]}>
          <Post p={[0, 0, 0]} r={11} h={10} m={metal} seg={28} />
          <mesh position={[0, 0, 10]} material={metal} castShadow scale={[1, 1, 0.35]}>
            <sphereGeometry args={[11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
      )
    case 'oring':
      return (
        <group position={[x, y, z]}>
          <Post p={[0, 0, 0]} r={11} h={14} m={metal} seg={28} />
          <Post p={[0, 0, 4]} r={11.4} h={2.5} m={plasticMat('#1a1a1a', 0.7)} seg={28} />
        </group>
      )
    default:
      return (
        <group position={[x, y, z]}>
          <Post p={[0, 0, 0]} r={11} h={11} m={metal} seg={36} />
        </group>
      )
  }
}

export function Switch({ p, type, hw, light, angle = 0 }: { p: V3; type: Design['electronics']['switchType']; hw: Design['hardware']['color']; light: boolean; angle?: number }) {
  const metal = hardwareMat(hw)
  const tip = plasticMat(light ? '#efeadf' : '#141414', 0.35)
  const [x, y, z] = p
  if (type === 'none') return null
  if (type === 'toggle3')
    return (
      <group position={[x, y, z]}>
        <Post p={[0, 0, 0]} r={9} h={1.2} m={metal} seg={24} />
        <Post p={[0, 0, 0]} r={4.2} h={5} m={metal} />
        <mesh position={[0, -3, 13]} rotation={[Math.PI / 2 - 0.35, 0, 0]} material={metal} castShadow>
          <cylinderGeometry args={[1.2, 1.6, 18, 10]} />
        </mesh>
        <mesh position={[0, -6.5, 23]} rotation={[Math.PI / 2 - 0.35, 0, 0]} material={tip} castShadow>
          <cylinderGeometry args={[4.4, 3.4, 9, 16]} />
        </mesh>
      </group>
    )
  return (
    <group position={[x, y, z]} rotation={[0, 0, angle]}>
      <Box p={[0, 0, 0.6]} s={[7, 30, 1.2]} m={plasticMat('#0b0b0b', 0.6)} />
      <Box p={[0, 5, 6]} s={[8, 6, 9]} m={tip} r={[0.25, 0, 0]} />
    </group>
  )
}

export function Jack({ p, normal, type, hw, z }: { p: { x: number; y: number }; normal: { x: number; y: number }; type: Design['electronics']['jack']; hw: Design['hardware']['color']; z: number }) {
  const metal = hardwareMat(hw)
  const black = plasticMat('#0c0c0c', 0.6)
  const ang = Math.atan2(normal.y, normal.x)
  if (type === 'strat-plate')
    return (
      <group position={[p.x, p.y, z]} rotation={[0, 0, ang]}>
        <mesh scale={[1.4, 1, 0.25]} material={metal} castShadow>
          <sphereGeometry args={[16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <Post p={[0, 0, 1]} r={6} h={3} m={black} />
      </group>
    )
  // edge-mounted: plate on the side wall, facing outward
  return (
    <group position={[p.x, p.y, z]} rotation={[0, 0, ang]}>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0.5, 0, 0]} material={metal} castShadow>
        {type === 'lp-plate' ? <boxGeometry args={[18, 34, 1.4]} /> : <cylinderGeometry args={[11, 11, 1.4, 28]} />}
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[3, 0, 0]} material={metal}>
        <cylinderGeometry args={[4.6, 4.6, 5, 16]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[5.6, 0, 0]} material={black}>
        <cylinderGeometry args={[3.2, 3.2, 0.4, 16]} />
      </mesh>
    </group>
  )
}

export function StrapButton({ p, normal, z, hw }: { p: { x: number; y: number }; normal: { x: number; y: number }; z: number; hw: Design['hardware']['color'] }) {
  const m = hardwareMat(hw)
  const ang = Math.atan2(normal.y, normal.x)
  return (
    <group position={[p.x, p.y, z]} rotation={[0, 0, ang]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[4, 0, 0]} material={m} castShadow>
        <cylinderGeometry args={[4, 6, 8, 18]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[9, 0, 0]} material={m} castShadow>
        <cylinderGeometry args={[7, 7, 2.4, 20]} />
      </mesh>
    </group>
  )
}

/** Tuner in headstock-local space: face at z=0, back at z=-thickness. */
export function Tuner({ x, y, side, thickness, hw, locking }: { x: number; y: number; side: number; thickness: number; hw: Design['hardware']['color']; locking: boolean }) {
  const m = hardwareMat(hw)
  return (
    <group position={[x, y, 0]}>
      <Post p={[0, 0, 0]} r={5.5} h={1.4} m={m} />
      <Post p={[0, 0, 0]} r={3} h={locking ? 12 : 14} m={m} />
      {locking && <Post p={[0, 0, -thickness - 14]} r={5} h={4} m={m} />}
      <Box p={[side * 3, 0, -thickness - 6]} s={[18, 14, 12]} m={m} />
      <mesh position={[side * 16, 0, -thickness - 6]} rotation={[0, 0, Math.PI / 2]} material={m}>
        <cylinderGeometry args={[1.5, 1.5, 12, 8]} />
      </mesh>
      <mesh position={[side * 23, 0, -thickness - 6]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]} material={m} castShadow>
        <cylinderGeometry args={[7.5, 7.5, 3.6, 20]} />
      </mesh>
    </group>
  )
}
