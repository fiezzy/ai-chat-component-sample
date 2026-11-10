import {
  convertToModelMessages,
  safeValidateUIMessages,
  smoothStream,
  streamText,
  type LanguageModel,
} from 'ai'

import { isApiErrorBody, type ApiErrorBody } from '@/shared/api/errors'
import { type IqMetadata, type IqUIMessage } from '@/shared/api/iq/types'
import {
  IQ_MAX_MESSAGE_LENGTH,
  IQ_SCENARIO_HEADER,
} from '@/shared/constants/api'
import { redact } from '@/shared/lib/privacy'

import { createMockModel, type Wait } from './mockModel'
import {
  continueScript,
  selectScenario,
  textOf,
  type Script,
} from './scenarios'
import { iqTools } from './tools'

interface HandleIqOptions {
  wait?: Wait
  /** The pause between words of the output; null sends them without one. */
  wordDelayMs?: number | null
  /** The model to call. By default a mock that plays the scenario script. */
  model?: (script: Script) => LanguageModel
}

const sleep: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** How much of the conversation the model sees. */
const MAX_HISTORY_MESSAGES = 20

/** A bound against abuse, far above any real conversation. */
const MAX_REQUEST_MESSAGES = 200

const INVALID_REQUEST: ApiErrorBody = {
  code: 'invalid_request',
  message: 'Invalid request',
  retryable: false,
}

const UNAVAILABLE: ApiErrorBody = {
  code: 'unavailable',
  message: 'Unavailable',
  retryable: true,
}

const errorResponse = (status: number, error: ApiErrorBody) =>
  Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })

/** Stream errors reach the client in the same envelope as HTTP errors. */
const toErrorText = (error: unknown) => {
  // The SDK wraps a provider's stream error and keeps its payload in `data`.
  const payload = error instanceof Error && 'data' in error ? error.data : error
  return JSON.stringify({
    error: isApiErrorBody(payload) ? payload : UNAVAILABLE,
  })
}

const readMessages = async (request: Request) => {
  const body = await request.json().catch(() => null)
  if (body?.messages?.length > MAX_REQUEST_MESSAGES) return null

  // Rejects anything outside the UI message shape, an empty list included.
  const messages = await safeValidateUIMessages<IqUIMessage>({
    messages: body?.messages,
    tools: iqTools,
  })
  if (!messages.success) return null

  const tooLong = messages.data.some(
    (message) =>
      message.role === 'user' && textOf(message).length > IQ_MAX_MESSAGE_LENGTH,
  )
  return tooLong ? null : messages.data
}

/** The client masks too, but it can be bypassed. This is the enforcing step. */
/** The latest messages, starting with a question as models expect. */
const toHistory = (messages: IqUIMessage[]) => {
  const recent = messages.slice(-MAX_HISTORY_MESSAGES)
  const first = recent.findIndex((message) => message.role === 'user')
  return first === -1 ? recent : recent.slice(first)
}

const maskUserText = (message: IqUIMessage): IqUIMessage =>
  message.role !== 'user'
    ? message
    : {
        ...message,
        parts: message.parts.map((part) =>
          part.type === 'text'
            ? { ...part, text: redact(part.text).text }
            : part,
        ),
      }

export const handleIq = async (
  request: Request,
  { wait = sleep, wordDelayMs, model }: HandleIqOptions = {},
) => {
  const received = await readMessages(request)
  if (!received) return errorResponse(400, INVALID_REQUEST)

  const messages = received.map(maskUserText)
  const scenario = selectScenario(
    messages,
    request.headers.get(IQ_SCENARIO_HEADER),
  )
  if ('error' in scenario) return errorResponse(scenario.status, scenario.error)

  // History ending with the assistant asks to continue that partial answer.
  const last = messages[messages.length - 1]
  const script =
    last.role === 'assistant'
      ? continueScript(scenario, textOf(last))
      : scenario

  const result = streamText({
    model: model?.(script) ?? createMockModel(script, wait),
    messages: await convertToModelMessages(toHistory(messages)),
    tools: iqTools,
    experimental_transform: smoothStream({ delayInMs: wordDelayMs }),
    abortSignal: request.signal,
    // Reported to the client below, not logged.
    onError: () => {},
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }): IqMetadata | undefined => {
      if (part.type === 'start') return { aiGenerated: true }
      if (part.type === 'finish') return { finishReason: part.finishReason }
    },
    onError: toErrorText,
    headers: {
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
