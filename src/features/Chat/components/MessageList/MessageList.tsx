import { type Message } from '../../types'

import { AssistantMessage, UserMessage } from './components'
import s from './MessageList.module.css'

interface MessageListProps {
  messages: Message[]
  onRetry: () => void
}

export const MessageList = ({ messages, onRetry }: MessageListProps) => (
  <div aria-label="Conversation" aria-live="off" className={s.list} role="log">
    {messages.map((message) =>
      message.role === 'user' ? (
        <UserMessage key={message.id} message={message} />
      ) : (
        <AssistantMessage
          key={message.id}
          message={message}
          onRetry={onRetry}
        />
      ),
    )}
  </div>
)
