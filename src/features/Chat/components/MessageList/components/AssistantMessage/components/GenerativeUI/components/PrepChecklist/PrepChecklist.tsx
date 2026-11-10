import { type PrepChecklistProps } from '@/shared/api'

import s from './PrepChecklist.module.css'

export const PrepChecklist = ({ title, steps }: PrepChecklistProps) => (
  <div className={s.card}>
    <h3 className={s.title}>{title}</h3>
    <ul className={s.steps}>
      {steps.map((step) => (
        <li key={step}>
          <label className={s.step}>
            <input className={s.checkbox} type="checkbox" />
            {step}
          </label>
        </li>
      ))}
    </ul>
  </div>
)
