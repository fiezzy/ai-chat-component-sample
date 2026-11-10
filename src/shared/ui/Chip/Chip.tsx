import clx from 'classnames'
import { type ButtonHTMLAttributes } from 'react'

import s from './Chip.module.css'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement>

export const Chip = (props: ChipProps) => {
  const { className, type = 'button', ...rest } = props

  return <button className={clx(s.chip, className)} type={type} {...rest} />
}
