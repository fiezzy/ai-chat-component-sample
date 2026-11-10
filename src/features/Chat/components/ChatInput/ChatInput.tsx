import { type Ref, useId, useState } from 'react'

import { IQ_MAX_MESSAGE_LENGTH } from '@/shared/constants/api'
import { redact } from '@/shared/lib/privacy'

import { type ChatCommand } from '../../types'

import s from './ChatInput.module.css'
import { CommandMenu, FollowUps, PromptInput } from './components'
import { useCommandMenu } from './hooks/useCommandMenu'
import { getMaskingWarning } from './lib/getMaskingWarning'

interface ChatInputProps {
  commands?: ChatCommand[]
  /** Questions offered for the next turn, shown above the field. */
  followUps: string[]
  inputRef: Ref<HTMLTextAreaElement>
  isBusy: boolean
  onSend: (text: string) => void
  onStop: () => void
}

export const ChatInput = (props: ChatInputProps) => {
  const { commands = [], followUps, inputRef, isBusy, onSend, onStop } = props

  const [value, setValue] = useState('')
  const menuId = useId()

  const { found: maskedKinds } = redact(value)
  const canSend = value.trim().length > 0 && !isBusy

  const submit = () => {
    if (!canSend) return
    onSend(value)
    setValue('')
  }

  const pickCommand = (command: ChatCommand) => {
    onSend(`/${command.name}`)
    setValue('')
  }

  const menu = useCommandMenu({
    value,
    commands: isBusy ? [] : commands,
    onPick: pickCommand,
  })
  const getOptionId = (command: ChatCommand) => `${menuId}-${command.name}`

  return (
    <div>
      {followUps.length > 0 && (
        <FollowUps onPick={onSend} questions={followUps} />
      )}
      <div className={s.panel}>
        {maskedKinds.length > 0 && (
          <p className={s.maskingWarning} role="status">
            {getMaskingWarning(maskedKinds)}
          </p>
        )}
        {menu.isOpen && (
          <CommandMenu
            activeIndex={menu.activeIndex}
            commands={menu.matches}
            getOptionId={getOptionId}
            id={menuId}
            onHighlight={menu.setActiveIndex}
            onPick={pickCommand}
          />
        )}
        <PromptInput
          ref={inputRef}
          aria-activedescendant={
            menu.isOpen
              ? getOptionId(menu.matches[menu.activeIndex])
              : undefined
          }
          aria-autocomplete={commands.length > 0 ? 'list' : undefined}
          aria-controls={menu.isOpen ? menuId : undefined}
          aria-label="Your question"
          canSend={canSend}
          isBusy={isBusy}
          maxLength={IQ_MAX_MESSAGE_LENGTH}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={menu.handleKeyDown}
          onSend={submit}
          onStop={onStop}
          placeholder="Ask about a result, a term or a test"
          value={value}
        />
        <p className={s.disclosure}>
          Hilbi IQ is an AI. It can make mistakes and does not replace your
          doctor.
        </p>
      </div>
    </div>
  )
}
