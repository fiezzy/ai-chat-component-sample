import clx from 'classnames'
import { type ButtonHTMLAttributes } from 'react'

import s from './IconButton.module.css'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The accessible name; the icon itself is hidden from screen readers. */
  label: string
  variant?: 'primary' | 'secondary' | 'neutral'
}

export const IconButton = (props: IconButtonProps) => {
  const {
    label,
    variant = 'primary',
    className,
    type = 'button',
    ...rest
  } = props

  return (
    <button
      aria-label={label}
      className={clx(s.button, s[variant], className)}
      title={label}
      type={type}
      {...rest}
    />
  )
}
