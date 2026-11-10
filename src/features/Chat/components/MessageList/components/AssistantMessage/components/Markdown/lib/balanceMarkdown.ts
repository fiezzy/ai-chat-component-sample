const BOLD = '**'

/** Keeps a half-revealed "**bold" from flashing its raw asterisks. */
export const balanceMarkdown = (text: string) => {
  const trimmed = text.replace(/(?<!\*)\*$/, '')
  const isOpen = trimmed.split(BOLD).length % 2 === 0

  if (!isOpen) return trimmed
  return trimmed.endsWith(BOLD)
    ? trimmed.slice(0, -BOLD.length)
    : trimmed + BOLD
}
