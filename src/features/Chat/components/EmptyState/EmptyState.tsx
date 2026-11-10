import { SuggestionCard } from './components'
import { SUGGESTIONS } from './constants/suggestions'
import s from './EmptyState.module.css'

interface EmptyStateProps {
  onPick: (question: string) => void
}

export const EmptyState = ({ onPick }: EmptyStateProps) => (
  <div className={s.empty}>
    <h2 className={s.title}>What would you like to understand?</h2>
    <p>
      Hilbi IQ explains lab results, medical terms and test preparation in plain
      language. Leave out your name and ID numbers.
    </p>
    <ul className={s.suggestions}>
      {SUGGESTIONS.map((suggestion) => (
        <li key={suggestion.question}>
          <SuggestionCard {...suggestion} onPick={onPick} />
        </li>
      ))}
    </ul>
  </div>
)
