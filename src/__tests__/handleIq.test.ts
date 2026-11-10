import { describe, expect, it } from 'vitest'

import { handleIq } from '@/server/iq'
import { createMockModel } from '@/server/iq/mockModel'

const noWait = async () => {}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  handleIq(
    new Request('http://test/iq', {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { wait: noWait, wordDelayMs: null },
  )

const user = (text: string) => ({
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text }],
})

/** A question and its answer, as one turn of history. */
const turn = (index: number) => [
  { ...user(`Question ${index}`), id: `u${index}` },
  {
    id: `a${index}`,
    role: 'assistant',
    parts: [{ type: 'text', text: `Answer ${index}` }],
  },
]

const ask = (text: string, headers?: Record<string, string>) =>
  post({ messages: [user(text)] }, headers)

interface Chunk {
  type: string
  delta?: string
  toolName?: string
  errorText?: string
  messageId?: string
  messageMetadata?: { aiGenerated?: boolean; finishReason?: string }
}

const chunksOf = async (response: Response): Promise<Chunk[]> =>
  (await response.text())
    .split('\n\n')
    .map((frame) => frame.replace(/^data: /, ''))
    .filter((data) => data && data !== '[DONE]')
    .map((data) => JSON.parse(data))

const textOf = (chunks: Chunk[]) =>
  chunks
    .map((chunk) => (chunk.type === 'text-delta' ? chunk.delta : ''))
    .join('')

const finishOf = (chunks: Chunk[]) =>
  chunks.find((chunk) => chunk.type === 'finish')?.messageMetadata?.finishReason

describe('handleIq', () => {
  it.each([
    ['an empty history', { messages: [] }],
    [
      'a message outside the UI message shape',
      { messages: [{ role: 'user', content: 'hi' }] },
    ],
    ['an overlong question', { messages: [user('x'.repeat(4001))] }],
  ])('rejects %s with 400', async (_, body) => {
    const response = await post(body)

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('invalid_request')
  })

  it('rejects malformed JSON with 400', async () => {
    expect((await post('{nope')).status).toBe(400)
  })

  it('streams an AI-labelled answer that finishes', async () => {
    const response = await ask('What is cholesterol?')
    const chunks = await chunksOf(response)

    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(chunks[0].messageMetadata).toEqual({ aiGenerated: true })
    expect(textOf(chunks)).toContain('cholesterol')
    expect(finishOf(chunks)).toBe('stop')
  })

  it('never exposes the model to the client', async () => {
    const body = await (await ask('What is cholesterol?')).text()

    expect(body).not.toMatch(/iq-mock|hilbi-mock/)
  })

  it('places catalog components as tool calls', async () => {
    const chunks = await chunksOf(await ask('Explain my HbA1c'))
    const tools = chunks
      .filter((chunk) => chunk.type === 'tool-input-available')
      .map((chunk) => chunk.toolName)

    expect(tools).toEqual(['lab_result', 'care_action', 'suggest_follow_ups'])
  })

  it('answers a request for a diagnosis with a refusal', async () => {
    const chunks = await chunksOf(await ask('Can you diagnose me?'))

    expect(finishOf(chunks)).toBe('content-filter')
  })

  it.each([
    ['rate_limited', 429],
    ['unavailable', 503],
  ])('rejects scenario %s before the stream', async (scenario, status) => {
    const response = await ask('hi', { 'x-iq-scenario': scenario })

    expect(response.status).toBe(status)
    expect((await response.json()).error.retryable).toBe(true)
  })

  it('sends a mid-stream failure in the API error envelope', async () => {
    const chunks = await chunksOf(await ask('/mid_stream_error'))
    const error = chunks.find((chunk) => chunk.type === 'error')

    expect(JSON.parse(error!.errorText!)).toEqual({
      error: {
        code: 'overloaded',
        message: 'The model is overloaded',
        retryable: true,
      },
    })
  })

  it('never reports a dropped answer as finished', async () => {
    const chunks = await chunksOf(await ask('/dropped'))

    expect(textOf(chunks).length).toBeGreaterThan(0)
    expect(finishOf(chunks)).not.toBe('stop')
  })

  it('waits before the first token, as a model would while thinking', async () => {
    const waits: number[] = []
    const response = await handleIq(
      new Request('http://test/iq', {
        method: 'POST',
        body: JSON.stringify({ messages: [user('hi')] }),
      }),
      { wait: async (ms) => void waits.push(ms), wordDelayMs: null },
    )
    await response.text()

    expect(waits[0]).toBeGreaterThanOrEqual(1500)
  })

  it('runs a demo scenario typed as a command', async () => {
    const chunks = await chunksOf(await ask('/empty'))

    expect(textOf(chunks)).toBe('')
    expect(finishOf(chunks)).toBe('stop')
  })

  it('rejects a demo command that fails before the stream', async () => {
    expect((await ask(' /rate_limited ')).status).toBe(429)
  })

  it('treats an unknown command as a normal question', async () => {
    expect(textOf(await chunksOf(await ask('/nonsense')))).not.toBe('')
  })

  it('ignores an unknown scenario header', async () => {
    const response = await ask('hi', { 'x-iq-scenario': 'nonsense' })

    expect(response.status).toBe(200)
  })

  describe('a history ending with a partial answer', () => {
    const partial = (question: string, text: string) =>
      post({
        messages: [
          user(question),
          { id: 'a1', role: 'assistant', parts: [{ type: 'text', text }] },
        ],
      })

    it('continues the same answer from where it stopped', async () => {
      const chunks = await chunksOf(
        await partial(
          'What is cholesterol?',
          'I can explain lab results, medical terms ',
        ),
      )

      expect(chunks[0].messageId).toBe('a1')
      expect(textOf(chunks).startsWith('and how to prepare')).toBe(true)
      expect(finishOf(chunks)).toBe('stop')
    })

    it('succeeds even in a failing demo scenario', async () => {
      const chunks = await chunksOf(
        await partial('/mid_stream_error', 'I can explain '),
      )

      expect(finishOf(chunks)).toBe('stop')
    })
  })

  describe('what reaches the model', () => {
    /** Runs a request and returns the prompt the model was called with. */
    const promptOf = async (messages: unknown[]) => {
      let model: ReturnType<typeof createMockModel> | undefined
      const response = await handleIq(
        new Request('http://test/iq', {
          method: 'POST',
          body: JSON.stringify({ messages }),
        }),
        {
          wait: noWait,
          wordDelayMs: null,
          model: (script) => (model = createMockModel(script, noWait)),
        },
      )
      await response.text()
      return model?.doStreamCalls[0].prompt ?? []
    }

    it('masks personal data that bypassed the client', async () => {
      const prompt = JSON.stringify(
        await promptOf([user('Mail me at anna@mail.sk')]),
      )

      expect(prompt).toContain('Mail me at [email]')
      expect(prompt).not.toContain('anna@mail.sk')
    })

    it('sees only the latest history, starting with a question', async () => {
      // 15 turns and a new question: 31 messages, more than the model sees.
      const history = [
        ...Array.from({ length: 15 }, (_, index) => turn(index)).flat(),
        user('Latest'),
      ]
      const prompt = await promptOf(history)

      expect(prompt).toHaveLength(19)
      expect(prompt[0].role).toBe('user')
      expect(JSON.stringify(prompt.at(-1))).toContain('Latest')
    })
  })

  it('rejects a history far beyond any real conversation', async () => {
    const history = Array.from({ length: 101 }, (_, index) => turn(index))

    expect((await post({ messages: history.flat() })).status).toBe(400)
  })
})
