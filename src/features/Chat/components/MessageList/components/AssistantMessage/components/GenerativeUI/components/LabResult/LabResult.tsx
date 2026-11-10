import clx from 'classnames'
import { type CSSProperties } from 'react'

import { type LabResultProps } from '@/shared/api'

import s from './LabResult.module.css'
import { getLabScale } from './lib/getLabScale'
import { getLabStatus, type LabStatus } from './lib/getLabStatus'

const STATUS_LABELS: Record<LabStatus, string> = {
  below: 'Below range',
  in_range: 'In range',
  above: 'Above range',
}

export const LabResult = (props: LabResultProps) => {
  const { test, value, unit, low, high } = props

  const status = getLabStatus({ value, low, high })
  const scale = getLabScale({ value, low, high })
  const statusLabel = STATUS_LABELS[status]

  const scaleStyle = {
    '--low': `${scale.lowPercent}%`,
    '--high': `${scale.highPercent}%`,
    '--value': `${scale.valuePercent}%`,
  } as CSSProperties

  return (
    <figure className={s.card}>
      <div className={s.heading}>
        <figcaption className={s.test}>{test}</figcaption>
        <span
          className={clx(s.value, { [s.outOfRange]: status !== 'in_range' })}
        >
          {value}
          <span className={s.unit}>{unit}</span>
        </span>
      </div>
      <div
        aria-label={`${test} ${value} ${unit}. ${statusLabel}. Usual range ${low} to ${high} ${unit}.`}
        className={s.track}
        role="img"
        style={scaleStyle}
      >
        <span className={s.range} />
        <span className={s.marker} />
      </div>
      <div className={s.footer}>
        <span>
          Usual range {low} to {high} {unit}
        </span>
        <span className={s.status}>{statusLabel}</span>
      </div>
    </figure>
  )
}
