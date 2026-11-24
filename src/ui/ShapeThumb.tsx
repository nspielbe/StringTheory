import { useMemo } from 'react'
import type { ShapePoint } from '../types'
import { bounds, sampleOutline, toSvgPath } from '../lib/geometry'

export function ShapeThumb({ points, extra, height = 70, fill = '#3a332c', stroke = '#c9a06a' }: { points: ShapePoint[]; extra?: ShapePoint[]; height?: number; fill?: string; stroke?: string }) {
  const { path, vb, path2 } = useMemo(() => {
    const pts = sampleOutline(points, 3)
    const b = bounds(pts)
    const pad = Math.max(b.w, b.h) * 0.05
    return {
      path: toSvgPath(pts),
      path2: extra ? toSvgPath(sampleOutline(extra, 3)) : null,
      vb: `${b.minX - pad} ${-b.maxY - pad} ${b.w + pad * 2} ${b.h + pad * 2}`,
    }
  }, [points, extra])
  return (
    <svg viewBox={vb} style={{ height }}>
      <path d={path} fill={fill} stroke={stroke} strokeWidth={Math.max(2, height / 25)} vectorEffect="non-scaling-stroke" />
      {path2 && <path d={path2} fill="none" stroke="#e3a44f" strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeDasharray="3 2" />}
    </svg>
  )
}
