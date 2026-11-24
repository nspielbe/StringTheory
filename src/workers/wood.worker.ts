import { generateWood, type WoodGenRequest } from '../lib/woodGen'

self.onmessage = (e: MessageEvent<{ id: number; req: WoodGenRequest }>) => {
  const { id, req } = e.data
  const out = generateWood(req)
  ;(self as unknown as Worker).postMessage({ id, ...out }, [out.data.buffer])
}
