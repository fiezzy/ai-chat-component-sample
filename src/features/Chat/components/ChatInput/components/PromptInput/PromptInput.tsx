import {
  type KeyboardEvent,
  type Ref,
  type TextareaHTMLAttributes,
} from 'react'

import { IconButton } from '@/shared/ui/IconButton'
import { ArrowUpIcon, StopIcon } from '@/shared/ui/icons'

import s from './PromptInput.module.css'

interface PromptInputProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className'
> {
  ref?: Ref<HTMLTextAreaElement>
  isBusy: boolean
  canSend: boolean
  onSend: () => void
  onStop: () => void
}

export const PromptInput = (props: PromptInputProps) => {
  const { ref, isBusy, canSend, onSend, onStop, onKeyDown, ...rest } = props

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event)

    if (event.defaultPrevented || event.nativeEvent.isComposing) return
    if (event.key !== 'Enter' || event.shiftKey) return

    event.preventDefault()
    onSend()
  }

  return (
    <div className={s.field}>
      <textarea
        ref={ref}
        className={s.input}
        enterKeyHint="send"
        onKeyDown={handleKeyDown}
        rows={1}
        {...rest}
      />
      {isBusy ? (
        <IconButton label="Stop" onClick={onStop} variant="secondary">
          <StopIcon />
        </IconButton>
      ) : (
        <IconButton disabled={!canSend} label="Send" onClick={onSend}>
          <ArrowUpIcon />
        </IconButton>
      )}
    </div>
  )
}
