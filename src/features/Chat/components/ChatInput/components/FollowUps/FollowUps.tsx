import { Chip } from '@/shared/ui/Chip'

import s from './FollowUps.module.css'

interface FollowUpsProps {
  questions: string[]
  onPick: (question: string) => void
}

export const FollowUps = ({ questions, onPick }: FollowUpsProps) => (
  <div aria-label="Suggested questions" className={s.followUps} role="group">
    {questions.map((question) => (
      <Chip key={question} onClick={() => onPick(question)}>
        {question}
      </Chip>
    ))}
  </div>
)
