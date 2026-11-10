import clx from 'classnames'

import { type AssistantMessage as AssistantMessageData } from '../../../../types'

import s from './AssistantMessage.module.css'
import { AnswerOutcome, GenerativeUI, Markdown, Thinking } from './components'
import { getAnswerPhase } from './lib/getAnswerPhase'

interface AssistantMessageProps {
  message: AssistantMessageData
  onRetry: () => void
}

export const AssistantMessage = (props: AssistantMessageProps) => {
  const { message, onRetry } = props
  const { blocks, status, error } = message

  const phase = getAnswerPhase(status, blocks.length > 0)

  return (
    <article
      aria-label="AI-generated answer"
      className={clx(s.message, {
        [s.active]: phase === 'thinking' || phase === 'writing',
        [s.failed]: phase === 'failed' || phase === 'resuming',
      })}
      data-ai-generated="true"
    >
      <p className={s.label}>AI-generated</p>

      {phase === 'thinking' && <Thinking />}

      {blocks.map((block) =>
        block.kind === 'text' ? (
          <Markdown key={block.id} text={block.text} />
        ) : (
          <div key={block.id} className={s.component}>
            <GenerativeUI component={block.component} />
          </div>
        ),
      )}

      <AnswerOutcome error={error} onRetry={onRetry} phase={phase} />
    </article>
  )
}
