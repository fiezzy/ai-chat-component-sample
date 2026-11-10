import { type CareActionProps } from '@/shared/api'

import s from './CareAction.module.css'
import { CARE_ACTIONS } from './constants/careActions'

export const CareAction = ({ action, reason }: CareActionProps) => {
  const { label, href } = CARE_ACTIONS[action]

  return (
    <div className={s.action}>
      <p>{reason}</p>
      <a className={s.link} href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    </div>
  )
}
