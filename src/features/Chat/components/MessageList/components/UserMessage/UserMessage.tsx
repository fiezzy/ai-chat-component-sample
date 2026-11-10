import { type UserMessage as UserMessageData } from '../../../../types'

import { splitMasked } from './lib/splitMasked'
import s from './UserMessage.module.css'

interface UserMessageProps {
  message: UserMessageData
}

export const UserMessage = ({ message }: UserMessageProps) => {
  const { text, maskedCount } = message

  return (
    <div className={s.wrapper}>
      <p className={s.bubble}>
        {splitMasked(text).map((part, index) =>
          part.masked ? (
            <mark key={index} className={s.mask}>
              {part.text}
            </mark>
          ) : (
            part.text
          ),
        )}
      </p>
      {maskedCount > 0 && (
        <p className={s.note}>
          {maskedCount} personal {maskedCount === 1 ? 'detail' : 'details'}{' '}
          masked
        </p>
      )}
    </div>
  )
}
