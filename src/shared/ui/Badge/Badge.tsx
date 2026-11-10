import { type ReactNode } from 'react'

import s from './Badge.module.css'

interface BadgeProps {
  children: ReactNode
}

export const Badge = ({ children }: BadgeProps) => (
  <span className={s.badge}>{children}</span>
)
