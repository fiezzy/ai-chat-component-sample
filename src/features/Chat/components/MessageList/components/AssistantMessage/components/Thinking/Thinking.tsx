import { useDelayedFlag } from './hooks/useDelayedFlag'
import s from './Thinking.module.css'

const STILL_WORKING_DELAY_MS = 8000

export const Thinking = () => {
  const isStillWorking = useDelayedFlag(STILL_WORKING_DELAY_MS)

  return (
    <div className={s.thinking}>
      <span className={s.badge}>
        <span className={s.label}>Thinking</span>
      </span>
      {isStillWorking && <span>Still working on your answer</span>}
    </div>
  )
}
