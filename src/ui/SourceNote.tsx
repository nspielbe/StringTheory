import { useStore } from '../store'
import { planById } from '../data/plans'

/** One line under a shape picker naming the plan the shape was traced from. */
export function SourceNote({ source }: { source?: { plan: string; note: string } }) {
  const show = useStore((s) => s.showPlan)
  const plan = source ? planById(source.plan) : undefined
  if (!source || !plan) return null
  return (
    <p className="hint" title={source.note}>
      Traced from{' '}
      <button className="link-btn" onClick={() => show(plan.id)}>
        {plan.title}
      </button>
    </p>
  )
}
