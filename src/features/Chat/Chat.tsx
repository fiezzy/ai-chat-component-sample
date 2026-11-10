'use client'

import { useRef } from 'react'

import { IconButton } from '@/shared/ui/IconButton'
import { ArrowDownIcon } from '@/shared/ui/icons'

import s from './Chat.module.css'
import { ChatInput, EmptyState, MessageList } from './components'
import { useChat } from './hooks/useChat'
import { useStickToBottom } from './hooks/useStickToBottom'
import { getAnnouncement } from './lib/getAnnouncement'
import { getFollowUps } from './lib/getFollowUps'
import { type ChatCommand } from './types'

interface ChatProps {
  commands?: ChatCommand[]
  requestHeaders?: Record<string, string>
}

export const Chat = ({ commands, requestHeaders }: ChatProps) => {
  const { messages, isBusy, send, stop, retry } = useChat({ requestHeaders })
  const { scrollRef, contentRef, isPinned, handleScroll, jumpToLatest } =
    useStickToBottom(messages.length > 0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const followUps = getFollowUps(messages, isBusy)

  const handleSend = (text: string) => {
    send(text)
    jumpToLatest()
    inputRef.current?.focus()
  }

  return (
    <section aria-label="Hilbi IQ" className={s.chat}>
      <div className={s.body}>
        <div ref={scrollRef} className={s.scroll} onScroll={handleScroll}>
          <div ref={contentRef} className={s.content}>
            {messages.length === 0 ? (
              <EmptyState onPick={handleSend} />
            ) : (
              <MessageList messages={messages} onRetry={retry} />
            )}
          </div>
        </div>
        <div className={s.overlay}>
          {!isPinned && (
            <IconButton
              className={s.jump}
              label="Jump to latest"
              onClick={jumpToLatest}
              variant="neutral"
            >
              <ArrowDownIcon />
            </IconButton>
          )}
        </div>
      </div>
      <ChatInput
        commands={commands}
        followUps={followUps}
        inputRef={inputRef}
        isBusy={isBusy}
        onSend={handleSend}
        onStop={stop}
      />
      <p aria-live="polite" className={s.liveRegion}>
        {getAnnouncement(messages.at(-1))}
      </p>
    </section>
  )
}
