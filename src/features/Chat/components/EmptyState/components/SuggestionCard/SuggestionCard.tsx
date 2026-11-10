import { type ComponentType } from 'react'

import { ArrowUpIcon } from '@/shared/ui/icons'

import s from './SuggestionCard.module.css'

interface SuggestionCardProps {
  topic: string
  question: string
  Icon: ComponentType
  onPick: (question: string) => void
}

export const SuggestionCard = (props: SuggestionCardProps) => {
  const { topic, question, Icon, onPick } = props

  return (
    <button className={s.card} onClick={() => onPick(question)} type="button">
      <span className={s.icon}>
        <Icon />
      </span>
      <span className={s.arrow}>
        <ArrowUpIcon />
      </span>
      <span className={s.topic}>{topic}</span>
      <span className={s.question}>{question}</span>
    </button>
  )
}
