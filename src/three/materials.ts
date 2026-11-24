import * as THREE from 'three'
import type { Finish, HardwareColor } from '../types'

const hw = new Map<string, THREE.MeshStandardMaterial>()

export function hardwareMat(c: HardwareColor): THREE.MeshStandardMaterial {
  let m = hw.get(c)
  if (m) return m
  const p: Record<HardwareColor, THREE.MeshStandardMaterialParameters> = {
    chrome: { color: '#eef0f2', metalness: 1, roughness: 0.12 },
    nickel: { color: '#d9d0bf', metalness: 1, roughness: 0.24 },
    gold: { color: '#e3bb63', metalness: 1, roughness: 0.2 },
    black: { color: '#1d1d20', metalness: 0.75, roughness: 0.32 },
    satin: { color: '#c2c5c9', metalness: 1, roughness: 0.42 },
  }
  m = new THREE.MeshStandardMaterial(p[c])
  hw.set(c, m)
  return m
}

const plastics = new Map<string, THREE.MeshStandardMaterial>()
export function plasticMat(color: string, rough = 0.38): THREE.MeshStandardMaterial {
  const k = color + rough
  let m = plastics.get(k)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 })
    plastics.set(k, m)
  }
  return m
}

export const STRING_MAT = new THREE.MeshStandardMaterial({ color: '#d8d8d8', metalness: 1, roughness: 0.25 })
export const WOUND_MAT = new THREE.MeshStandardMaterial({ color: '#b9ab91', metalness: 1, roughness: 0.42 })
export const FRET_MATS: Record<string, THREE.MeshStandardMaterial> = {
  nickel: new THREE.MeshStandardMaterial({ color: '#d8d3c8', metalness: 1, roughness: 0.18 }),
  stainless: new THREE.MeshStandardMaterial({ color: '#eceff1', metalness: 1, roughness: 0.1 }),
  gold: new THREE.MeshStandardMaterial({ color: '#e2bd6a', metalness: 1, roughness: 0.18 }),
}

/** Surface properties of a finish (colour comes from the baked texture). */
export function finishProps(f: Finish): Partial<THREE.MeshPhysicalMaterialParameters> {
  const metallic = f.type === 'metallic'
  if (f.sheen === 'gloss')
    return { roughness: metallic ? 0.32 : 0.42, metalness: metallic ? 0.45 : 0, clearcoat: 1, clearcoatRoughness: 0.035 }
  if (f.sheen === 'satin')
    return { roughness: 0.6, metalness: metallic ? 0.35 : 0, clearcoat: 0.35, clearcoatRoughness: 0.5 }
  return { roughness: 0.78, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.8 }
}
