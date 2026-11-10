import { type ChatStatus } from 'ai'
import { describe, expect, it } from 'vitest'

import { toViewMessages } from '@/features/Chat/lib/toViewMessages'
import { type AssistantMessage } from '@/features/Chat/types'
import { type IqMetadata, type IqUIMessage } from '@/shared/api'

const user: IqUIMessage = {
  id: 'u',
  role: 'user',
  parts: [{ type: 'text', text: 'Hi' }],
  metadata: { maskedCount: 1 },
}

const answer = (
  parts: IqUIMessage['parts'],
  metadata: IqMetadata = { finishReason: 'stop' },
): IqUIMessage => ({ id: 'a', role: 'assistant', parts, metadata })

const text = (value: string) => ({ type: 'text' as const, text: value })

const view = (
  messages: IqUIMessage[],
  status: ChatStatus = 'ready',
  error?: Error,
) => toViewMessages(messages, { status, error, resume: null, failures: {} })

const lastAnswer = (...args: Parameters<typeof view>) =>
  view(...args).at(-1) as AssistantMessage

const apiError = (code: string, retryable = true) =>
  new Error(JSON.stringify({ error: { code, message: code, retryable } }))

describe('toViewMessages', () => {
  it('keeps what the user sent and how much was masked', () => {
    expect(view([user])[0]).toEqual({
      id: 'u',
      role: 'user',
      text: 'Hi',
      maskedCount: 1,
    })
  })

  it('reads a continued answer as one paragraph', () => {
    const { blocks } = lastAnswer([
      user,
      answer([text('Partial '), text('continued.')]),
    ])

    expect(blocks).toEqual([
      { kind: 'text', id: 'a-0', text: 'Partial continued.' },
    ])
  })

  it('renders a catalog tool call as a component and skips anything else', () => {
    const input = { level: 'urgent' as const, text: 'Go' }
    const { blocks } = lastAnswer([
      user,
      answer([
        {
          type: 'tool-safety_notice',
          toolCallId: 'c1',
          state: 'output-available',
          input,
          output: 'shown',
        },
        // A call the gateway rejected never reaches output-available.
        {
          type: 'tool-safety_notice',
          toolCallId: 'c2',
          state: 'output-error',
          input,
          errorText: 'Invalid input',
        },
        {
          type: 'tool-suggest_follow_ups',
          toolCallId: 's',
          state: 'output-available',
          input: { questions: ['Why?'] },
          output: 'shown',
        },
      ]),
    ])

    expect(blocks).toEqual([
      {
        kind: 'component',
        id: 'c1',
        component: { name: 'safety_notice', props: input },
      },
    ])
  })

  it.each([
    ['stop', 'complete'],
    ['length', 'truncated'],
    ['content-filter', 'refused'],
  ] as const)('maps finish reason %s to %s', (finishReason, status) => {
    expect(
      lastAnswer([user, answer([text('x')], { finishReason })]).status,
    ).toBe(status)
  })

  it('treats an answer that never finished as interrupted', () => {
    const last = lastAnswer([user, answer([text('Half')], {})])

    expect(last.status).toBe('failed')
    expect(last.error?.message).toMatch(/connection dropped/)
  })

  it('fails a finished answer with no content', () => {
    expect(lastAnswer([user, answer([])]).error?.message).toBe(
      'No answer was returned.',
    )
  })

  it('shows a stopped answer as stopped', () => {
    expect(
      lastAnswer([user, answer([text('x')], { stopped: true })]).status,
    ).toBe('stopped')
  })

  it('shows a thinking answer before any chunk arrives', () => {
    expect(lastAnswer([user], 'submitted')).toMatchObject({
      status: 'pending',
      blocks: [],
    })
  })

  it('shows a rejected request as a failed answer, with its code', () => {
    const last = lastAnswer([user], 'error', apiError('rate_limited'))

    expect(last.status).toBe('failed')
    expect(last.error).toEqual({
      message: expect.stringMatching(/Too many questions/),
      retryable: true,
    })
  })

  it('tells a lost connection apart from a dropped answer', () => {
    const offline = new TypeError('Failed to fetch')

    expect(lastAnswer([user], 'error', offline).error?.message).toMatch(
      /Could not reach/,
    )
    expect(
      lastAnswer([user, answer([text('Half')], {})], 'error', offline).error
        ?.message,
    ).toMatch(/connection dropped/)
  })

  it('keeps the error and loader of a resumed answer until new text arrives', () => {
    const failed = answer([text('Half')], {})
    const error = { message: 'Dropped', retryable: true }
    const resume = { id: 'a', size: 4, error }

    const waiting = toViewMessages([user, failed], {
      status: 'streaming',
      resume,
      failures: {},
    })
    const continued = toViewMessages(
      [user, answer([text('Half'), text(' more')], {})],
      { status: 'streaming', resume, failures: {} },
    )

    expect(waiting.at(-1)).toMatchObject({ status: 'resuming', error })
    expect(continued.at(-1)).toMatchObject({ status: 'streaming' })
  })

  it('keeps an earlier failure in the history, without a retry', () => {
    const next: IqUIMessage = { ...user, id: 'u2' }
    const error = { message: 'Too many questions.', retryable: true }
    const messages = toViewMessages([user, next], {
      status: 'submitted',
      resume: null,
      failures: { u: error },
    })

    expect(messages.map(({ role }) => role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ])
    expect(messages[1]).toMatchObject({
      status: 'failed',
      error: { message: 'Too many questions.', retryable: false },
    })
  })
})
