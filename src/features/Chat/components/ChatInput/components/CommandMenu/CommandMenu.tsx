import clx from 'classnames'

import { type ChatCommand } from '../../../../types'

import s from './CommandMenu.module.css'

interface CommandMenuProps {
  id: string
  commands: ChatCommand[]
  activeIndex: number
  getOptionId: (command: ChatCommand) => string
  onHighlight: (index: number) => void
  onPick: (command: ChatCommand) => void
}

export const CommandMenu = (props: CommandMenuProps) => {
  const { id, commands, activeIndex, getOptionId, onHighlight, onPick } = props

  return (
    <ul aria-label="Commands" className={s.menu} id={id} role="listbox">
      {/* mousedown is cancelled so focus stays in the text field, where the
          keyboard drives the menu. */}
      {commands.map((command, index) => (
        <li
          key={command.name}
          aria-selected={index === activeIndex}
          className={clx(s.option, { [s.active]: index === activeIndex })}
          id={getOptionId(command)}
          onClick={() => onPick(command)}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => onHighlight(index)}
          role="option"
        >
          <span className={s.name}>/{command.name}</span>
          <span className={s.description}>{command.description}</span>
        </li>
      ))}
    </ul>
  )
}
