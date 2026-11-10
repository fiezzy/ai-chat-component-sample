import { type Message } from '../types'

export const getAnnouncement = (message?: Message) => {
  if (message?.role !== 'assistant') return ''

  if (message.status === 'pending' || message.status === 'streaming') {
    return 'Hilbi IQ is answering.'
  }

  const text = message.blocks
    .flatMap((block) => (block.kind === 'text' ? block.text : []))
    .join(' ')

  return text ? `Hilbi IQ answered: ${text}` : ''
}
