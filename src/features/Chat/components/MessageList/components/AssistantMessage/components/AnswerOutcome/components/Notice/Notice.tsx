import clx from 'classnames'
import { type ReactNode } from 'react'

import s from './Notice.module.css'

interface NoticeAction {
  label: string
  onClick: () => void
  loading?: boolean
}

interface NoticeProps {
  tone?: 'neutral' | 'error'
  children: ReactNode
  action?: NoticeAction
}

export const Notice = ({ tone = 'neutral', children, action }: NoticeProps) => (
  <div
    className={clx(s.notice, s[tone])}
    role={tone === 'error' ? 'alert' : undefined}
  >
    <p className={s.text}>{children}</p>
    {action && (
      <button
        aria-busy={action.loading || undefined}
        className={s.action}
        disabled={action.loading}
        onClick={action.onClick}
        type="button"
      >
        {action.loading && <span aria-hidden="true" className={s.spinner} />}
        {action.label}
      </button>
    )}
  </div>
)
