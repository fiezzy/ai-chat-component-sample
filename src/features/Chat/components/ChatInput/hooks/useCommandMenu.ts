import { type KeyboardEvent, useState } from 'react'

import { type ChatCommand } from '../../../types'
import { filterCommands } from '../lib/filterCommands'

interface UseCommandMenuOptions {
  value: string
  commands: ChatCommand[]
  onPick: (command: ChatCommand) => void
}

export const useCommandMenu = (options: UseCommandMenuOptions) => {
  const { value, commands, onPick } = options

  const [highlight, setHighlight] = useState({ value, index: 0 })
  const [dismissedValue, setDismissedValue] = useState<string | null>(null)

  const matches = filterCommands(commands, value)
  const isOpen = matches.length > 0 && value !== dismissedValue
  const activeIndex = highlight.value === value ? highlight.index : 0

  const setActiveIndex = (index: number) => setHighlight({ value, index })

  const move = (step: number) =>
    setActiveIndex((activeIndex + step + matches.length) % matches.length)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return false

    switch (event.key) {
      case 'ArrowDown':
        move(1)
        break
      case 'ArrowUp':
        move(-1)
        break
      case 'Enter':
      case 'Tab':
        onPick(matches[activeIndex])
        break
      case 'Escape':
        setDismissedValue(value)
        break
      default:
        return false
    }

    event.preventDefault()
    return true
  }

  return { isOpen, matches, activeIndex, setActiveIndex, handleKeyDown }
}
