import { memo } from 'react'
import ReactMarkdown from 'react-markdown'

import { balanceMarkdown } from './lib/balanceMarkdown'
import { rehypeWords } from './lib/rehypeWords'
import s from './Markdown.module.css'

// Links, images and raw HTML are left out on purpose: model text never gets to
// send a patient somewhere or load anything. Spans come only from rehypeWords,
// because raw HTML in the markdown is never parsed.
const ALLOWED_ELEMENTS = [
  'p',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'h3',
  'code',
  'span',
]

const REHYPE_PLUGINS = [[rehypeWords, { className: s.word }]] as const

interface MarkdownProps {
  text: string
}

export const Markdown = memo(({ text }: MarkdownProps) => (
  <div className={s.markdown}>
    <ReactMarkdown
      allowedElements={ALLOWED_ELEMENTS}
      rehypePlugins={REHYPE_PLUGINS as never}
      unwrapDisallowed
    >
      {balanceMarkdown(text)}
    </ReactMarkdown>
  </div>
))

Markdown.displayName = 'Markdown'
