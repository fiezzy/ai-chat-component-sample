import { useEffect, useState } from 'react'

/** Turns true once `delayMs` has passed since the component mounted. */
export const useDelayedFlag = (delayMs: number) => {
  const [isElapsed, setIsElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsElapsed(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  return isElapsed
}
