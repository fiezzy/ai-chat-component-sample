import { useChat as useAiChat } from '@ai-sdk/react'
import { useState } from 'react'

import { iqTransport, type IqUIMessage } from '@/shared/api'
import { redact } from '@/shared/lib/privacy'

import { getBlocksLength } from '../lib/getBlocksLength'
import { toViewMessages, type Resume } from '../lib/toViewMessages'
import { type AssistantError } from '../types'

interface UseChatOptions {
  requestHeaders?: Record<string, string>
}

export const useChat = ({ requestHeaders }: UseChatOptions = {}) => {
  const [resume, setResume] = useState<Resume | null>(null)
  const [failures, setFailures] = useState<Record<string, AssistantError>>({})
  const chat = useAiChat<IqUIMessage>({ transport: iqTransport })
  const { status, error, sendMessage, regenerate, setMessages } = chat

  const messages = toViewMessages(chat.messages, {
    status,
    error,
    resume,
    failures,
  })
  const isBusy = status === 'submitted' || status === 'streaming'
  const options = { headers: requestHeaders }

  const send = (input: string) => {
    const { text, found } = redact(input.trim())
    if (!text || isBusy) return

    const last = messages.at(-1)
    const owner = chat.messages.at(-1)
    if (last?.role === 'assistant' && last.error && owner) {
      const failure = last.error
      setFailures((current) => ({ ...current, [owner.id]: failure }))
    }

    void sendMessage({ text, metadata: { maskedCount: found.length } }, options)
  }

  const stop = async () => {
    await chat.stop()
    setMessages((current) =>
      current.map((message, index) =>
        index === current.length - 1 && message.role === 'assistant'
          ? { ...message, metadata: { ...message.metadata, stopped: true } }
          : message,
      ),
    )
  }

  const retry = () => {
    const last = messages.at(-1)
    if (isBusy || last?.role !== 'assistant' || !last.error) return

    if (last.blocks.some((block) => block.kind === 'text')) {
      const size = getBlocksLength(last.blocks)
      setResume({ id: last.id, size, error: last.error })
      void sendMessage(undefined, options)
      return
    }

    void regenerate(options)
  }

  return { messages, isBusy, send, stop, retry }
}
