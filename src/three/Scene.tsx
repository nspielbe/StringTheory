import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import { Guitar, type GuitarInfo } from './Guitar'
import { useStore } from '../store'

// Scale: the guitar is built in millimetres; the scene runs in metres.
const MM = 0.001

export interface CaptureOptions {
  view: string
  width: number
  height: number
  background: 'studio' | 'transparent' | 'dark' | 'light' | 'warm'
}

export interface RenderApi {
  capture: (o: CaptureOptions) => Promise<string>
}

// Global so hot-reloads and remounts never leave a stale handle.
const g = globalThis as unknown as { __renderApi?: { current: RenderApi | null } }
export const renderApi: { current: RenderApi | null } = (g.__renderApi ??= { current: null })

export const BACKGROUNDS: Record<CaptureOptions['background'], string | null> = {
  studio: '#23211f',
  dark: '#0b0b0c',
  light: '#eceae6',
  warm: '#3a2a1e',
  transparent: null,
}

function viewPose(view: string, info: GuitarInfo | null): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const c = info ? ((info.minY + info.maxY) / 2) * MM : 0.3
  const off = c
  const body = info ? info.bodyCenterY * MM - off : -0.2
  const head = info ? info.headCenterY * MM - off : 0.45
  const t = new THREE.Vector3(0, 0, 0.02)
  // long bodies (V / X styles) need the camera further back
  const k = info ? Math.max(1, (info.maxY - info.minY) / 1000) : 1
  const far = (x: number, y: number, z: number) => new THREE.Vector3(x * k, y * k, z * k)
  switch (view) {
    case 'front': return { pos: far(0, 0, 2.1), target: t }
    case 'back': return { pos: far(0, 0, -2.1), target: t }
    case 'side': return { pos: far(2.0, 0.05, 0.12), target: t }
    case 'edge': return { pos: far(-1.6, -0.4, 0.4), target: t }
    case 'body': return { pos: new THREE.Vector3(0.28, body - 0.2, 0.72), target: new THREE.Vector3(0, body, 0.02) }
    case 'headstock': return { pos: new THREE.Vector3(0.18, head - 0.12, 0.42), target: new THREE.Vector3(0, head, 0) }
    case 'hero': return { pos: far(-0.85, -0.55, 1.15), target: new THREE.Vector3(0, -0.05, 0) }
    case 'flat': return { pos: far(0, -0.9, 1.35), target: t }
    default: return { pos: far(1.1, -0.3, 1.6), target: t }
  }
}

function Rig({ info }: { info: GuitarInfo | null }) {
  const controls = useRef<OrbitImpl>(null)
  const { camera, gl, scene } = useThree()
  const req = useStore((s) => s.viewRequest)
  const autoRotate = useStore((s) => s.autoRotate)
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; tf: THREE.Vector3; tt: THREE.Vector3; t: number } | null>(null)

  useEffect(() => {
    const pose = viewPose(req.view, info)
    const c = controls.current
    anim.current = { from: camera.position.clone(), to: pose.pos, tf: c ? c.target.clone() : new THREE.Vector3(), tt: pose.target, t: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req.n])

  useFrame((_, dt) => {
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + dt / 0.7)
    const k = 1 - Math.pow(1 - a.t, 3)
    camera.position.lerpVectors(a.from, a.to, k)
    controls.current?.target.lerpVectors(a.tf, a.tt, k)
    controls.current?.update()
    if (a.t >= 1) anim.current = null
  })

  useEffect(() => {
    const api: RenderApi = {
      capture: async (o) => {
        const cam = (camera as THREE.PerspectiveCamera).clone()
        const pose = viewPose(o.view, info)
        if (o.view !== 'current') {
          cam.position.copy(pose.pos)
          cam.lookAt(pose.target)
        } else {
          cam.position.copy(camera.position)
          cam.quaternion.copy(camera.quaternion)
        }
        cam.aspect = o.width / o.height
        cam.updateProjectionMatrix()
        const oldSize = gl.getSize(new THREE.Vector2())
        const oldRatio = gl.getPixelRatio()
        const oldBg = scene.background
        const bg = BACKGROUNDS[o.background]
        scene.background = bg ? new THREE.Color(bg) : null
        gl.setPixelRatio(1)
        gl.setSize(o.width, o.height, false)
        gl.setClearColor(0x000000, bg ? 1 : 0)
        gl.render(scene, cam)
        const url = gl.domElement.toDataURL('image/png')
        gl.setPixelRatio(oldRatio)
        gl.setSize(oldSize.x, oldSize.y, false)
        scene.background = oldBg
        gl.setClearColor(0x000000, 0)
        return url
      },
    }
    renderApi.current = api
    return () => {
      if (renderApi.current === api) renderApi.current = null
    }
  }, [camera, gl, scene, info])

  return <OrbitControls ref={controls as never} makeDefault enableDamping dampingFactor={0.08} minDistance={0.12} maxDistance={4} autoRotate={autoRotate} autoRotateSpeed={0.8} />
}

export function Scene() {
  const d = useStore((s) => s.design)
  const showStrings = useStore((s) => s.showStrings)
  const showHardware = useStore((s) => s.showHardware)
  const [info, setInfo] = useState<GuitarInfo | null>(null)
  const onInfo = useCallback((i: GuitarInfo) => setInfo((p) => (p && p.minY === i.minY && p.maxY === i.maxY && p.volumeMm3 === i.volumeMm3 ? p : i)), [])
  useEffect(() => {
    if (info) (window as unknown as { __guitarInfo?: GuitarInfo }).__guitarInfo = info
  }, [info])
  const center = info ? (info.minY + info.maxY) / 2 : 300
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: [1.1, -0.3, 1.6], fov: 32, near: 0.01, far: 20 }}
    >
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.6} position={[-2.2, 2.6, 2.2]} scale={[3.2, 1.4, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.4} position={[2.8, 0.6, 1.4]} scale={[2.6, 1.2, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.8} position={[0, 4, 0.4]} scale={[5, 2, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={2.2} position={[1.8, 2.4, -2.4]} scale={[3.2, 1.4, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.0} position={[-2.6, 0.2, -1.6]} scale={[2.4, 1.2, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={0.5} position={[0, -3, 1]} scale={[5, 3, 1]} color="#ffd9b0" target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={0.55} position={[0.9, 1.4, 4]} scale={[2.4, 1, 1]} target={[0, 0, 0]} />
        </Environment>
      </Suspense>
      <ambientLight intensity={0.15} />
      <directionalLight position={[0.8, 1.2, 2.2]} intensity={1.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-0.8, 0.8, 0.8, -0.8, 0.1, 6]} />
      </directionalLight>
      <directionalLight position={[-1.2, 1.0, -1.8]} intensity={0.9} />
      <group scale={MM} position={[0, -center * MM, 0]}>
        <group scale={[d.leftHanded ? -1 : 1, 1, 1]}>
          <Guitar d={d} showStrings={showStrings} showHardware={showHardware} onInfo={onInfo} />
        </group>
      </group>
      <Rig info={info} />
    </Canvas>
  )
}
