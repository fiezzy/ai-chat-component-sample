import { type AssistantStatus } from '../../../../../types'

export type AnswerPhase =
  'thinking' | 'writing' | Exclude<AssistantStatus, 'pending' | 'streaming'>

export const getAnswerPhase = (
  status: AssistantStatus,
  hasContent: boolean,
): AnswerPhase => {
  switch (status) {
    case 'pending':
    case 'streaming':
      return hasContent ? 'writing' : 'thinking'
    default:
      return status
  }
}
