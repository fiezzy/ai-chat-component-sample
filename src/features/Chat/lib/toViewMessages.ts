import {
  getStaticToolName,
  isStaticToolUIPart,
  type ChatStatus,
  type FinishReason,
} from 'ai'

import { readApiError, type IqComponent, type IqUIMessage } from '@/shared/api'

import {
  EMPTY_ANSWER_MESSAGE,
  getErrorMessage,
} from '../constants/errorMessages'
import {
  type AssistantError,
  type AssistantMessage,
  type AssistantStatus,
  type Block,
  type Message,
  type UserMessage,
} from '../types'

import { getBlocksLength } from './getBlocksLength'

export interface Resume {
  id: string
  size: number
  error: AssistantError
}

interface ChatView {
  status: ChatStatus
  error?: Error
  resume: Resume | null
  failures: Record<string, AssistantError>
}

const FINISHED: Partial<Record<FinishReason, AssistantStatus>> = {
  stop: 'complete',
  'tool-calls': 'complete',
  length: 'truncated',
  'content-filter': 'refused',
}

const toBlocks = ({ id, parts }: IqUIMessage) =>
  parts.reduce<Block[]>((blocks, part, index) => {
    const last = blocks.at(-1)

    if (part.type === 'text') {
      return last?.kind === 'text'
        ? [...blocks.slice(0, -1), { ...last, text: last.text + part.text }]
        : [...blocks, { kind: 'text', id: `${id}-${index}`, text: part.text }]
    }

    if (!isStaticToolUIPart(part) || part.state !== 'output-available') {
      return blocks
    }

    const name = getStaticToolName(part)
    if (name === 'suggest_follow_ups') return blocks

    const component = { name, props: part.input } as IqComponent
    return [...blocks, { kind: 'component', id: part.toolCallId, component }]
  }, [])

const toSuggestions = ({ parts }: IqUIMessage) =>
  parts.flatMap((part) =>
    part.type === 'tool-suggest_follow_ups' && part.state === 'output-available'
      ? part.input.questions
      : [],
  )

const toFailure = (
  error: Error | undefined,
  hasContent: boolean,
): AssistantError => {
  const body = error && readApiError(error)
  if (body) {
    return { message: getErrorMessage(body.code), retryable: body.retryable }
  }

  const code = hasContent ? 'interrupted' : 'network'
  return { message: getErrorMessage(code), retryable: true }
}

const toAssistant = (
  message: IqUIMessage,
  isLast: boolean,
  { status, error, resume, failures }: ChatView,
  ownerId = message.id,
): AssistantMessage => {
  const blocks = toBlocks(message)
  const answer = {
    id: message.id,
    role: 'assistant' as const,
    blocks,
    suggestions: toSuggestions(message),
  }
  const failed = (failure: AssistantError): AssistantMessage => ({
    ...answer,
    status: 'failed',
    error: { ...failure, retryable: failure.retryable && isLast },
  })

  if (isLast && (status === 'submitted' || status === 'streaming')) {
    const isResuming =
      resume?.id === message.id && getBlocksLength(blocks) === resume.size

    if (isResuming)
      return { ...answer, status: 'resuming', error: resume.error }
    return { ...answer, status: blocks.length > 0 ? 'streaming' : 'pending' }
  }

  if (isLast && status === 'error')
    return failed(toFailure(error, blocks.length > 0))
  if (failures[ownerId]) return failed(failures[ownerId])
  if (message.metadata?.stopped) return { ...answer, status: 'stopped' }

  const finished = FINISHED[message.metadata?.finishReason ?? 'other']
  if (!finished) return failed(toFailure(undefined, true))
  if (blocks.length === 0) {
    return failed({ message: EMPTY_ANSWER_MESSAGE, retryable: true })
  }

  return { ...answer, status: finished }
}

const textOf = ({ parts }: IqUIMessage) =>
  parts.flatMap((part) => (part.type === 'text' ? part.text : [])).join('')

export const toViewMessages = (
  messages: IqUIMessage[],
  view: ChatView,
): Message[] =>
  messages.flatMap((message, index): Message[] => {
    const isLast = index === messages.length - 1
    if (message.role !== 'user') return [toAssistant(message, isLast, view)]

    const user: UserMessage = {
      id: message.id,
      role: 'user',
      text: textOf(message),
      maskedCount: message.metadata?.maskedCount ?? 0,
    }

    const hasAnswer = messages[index + 1]?.role === 'assistant'
    const needsPlaceholder =
      (isLast && view.status !== 'ready') || message.id in view.failures
    if (hasAnswer || !needsPlaceholder) return [user]

    const placeholder: IqUIMessage = {
      id: `${message.id}-answer`,
      role: 'assistant',
      parts: [],
    }
    return [user, toAssistant(placeholder, isLast, view, message.id)]
  })
