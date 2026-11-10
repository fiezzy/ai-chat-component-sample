import { type AssistantError } from '../../../../../../types'
import { type AnswerPhase } from '../../lib/getAnswerPhase'

import s from './AnswerOutcome.module.css'
import { Notice } from './components'

interface AnswerOutcomeProps {
  phase: AnswerPhase
  error?: AssistantError
  onRetry: () => void
}

export const AnswerOutcome = ({
  phase,
  error,
  onRetry,
}: AnswerOutcomeProps) => {
  switch (phase) {
    case 'truncated':
      return <Notice>This answer was cut short.</Notice>
    case 'refused':
      return <Notice>This question needs a doctor.</Notice>
    case 'stopped':
      return <p className={s.note}>Stopped</p>
    case 'failed':
    case 'resuming': {
      if (!error) return null

      const retry = {
        label: 'Try again',
        onClick: onRetry,
        loading: phase === 'resuming',
      }
      return (
        <Notice action={error.retryable ? retry : undefined} tone="error">
          {error.message}
        </Notice>
      )
    }
    default:
      return null
  }
}
