import { type ChatCommand } from '../../../types'

/** Commands matching what was typed, while the text is still one "/word". */
export const filterCommands = (commands: ChatCommand[], value: string) => {
  const query = value.match(/^\/(\w*)$/)?.[1]
  if (query === undefined) return []

  return commands.filter(({ name }) => name.startsWith(query.toLowerCase()))
}
