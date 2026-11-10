import { type Message } from '../types'

/** Follow-ups belong to the last answer, and only once it has finished well. */
export const getFollowUps = (messages: Message[], isBusy: boolean) => {
  const last = messages.at(-1)

  if (isBusy || last?.role !== 'assistant') return []
  return last.status === 'complete' ? (last.suggestions ?? []) : []
}
