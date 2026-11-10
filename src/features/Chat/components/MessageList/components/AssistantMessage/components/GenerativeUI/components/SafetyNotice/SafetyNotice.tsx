import { type SafetyNoticeProps } from '@/shared/api'
import { AlertCircleIcon } from '@/shared/ui/icons'

import s from './SafetyNotice.module.css'

const TITLES: Record<SafetyNoticeProps['level'], string> = {
  urgent: 'See a doctor today',
  emergency: 'Call your local emergency number',
}

export const SafetyNotice = ({ level, text }: SafetyNoticeProps) => (
  <div className={s.notice} role="alert">
    <AlertCircleIcon className={s.icon} />
    <div className={s.body}>
      <p className={s.title}>{TITLES[level]}</p>
      <p className={s.text}>{text}</p>
    </div>
  </div>
)
