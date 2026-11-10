interface HastText {
  type: 'text'
  value: string
}

interface HastElement {
  type: 'element'
  tagName: string
  properties: Record<string, unknown>
  children: HastNode[]
}

interface HastParent {
  type: string
  children?: HastNode[]
}

type HastNode = HastText | HastElement | HastParent

const isText = (node: HastNode): node is HastText => node.type === 'text'

const toWordSpans = (value: string, className: string): HastNode[] =>
  (value.match(/\s*\S+\s*/g) ?? [value]).map((word) => ({
    type: 'element',
    tagName: 'span',
    properties: { className: [className] },
    children: [{ type: 'text', value: word }],
  }))

const wrapWords = (node: HastParent, className: string) => {
  node.children = node.children?.flatMap((child) => {
    if (!isText(child)) {
      wrapWords(child, className)
      return [child]
    }
    // Whitespace between blocks stays as it is.
    return /\S/.test(child.value)
      ? toWordSpans(child.value, className)
      : [child]
  })
}

/**
 * Wraps every word in a span. react-markdown keys elements by position, so
 * words already on screen keep their element and only new ones mount and
 * play the fade-in.
 */
export const rehypeWords =
  ({ className }: { className: string }) =>
  (tree: HastParent) =>
    wrapWords(tree, className)
