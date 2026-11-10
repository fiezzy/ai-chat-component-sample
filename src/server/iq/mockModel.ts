import { MockLanguageModelV4 } from 'ai/test'

import { type Script } from './scenarios'

export type Wait = (ms: number) => Promise<void>

type StreamResult = Awaited<ReturnType<MockLanguageModelV4['doStream']>>
type StreamPart =
  StreamResult['stream'] extends ReadableStream<infer T> ? T : never

const FINISH_REASONS = {
  complete: 'stop',
  truncated: 'length',
  refused: 'content-filter',
} as const

const NO_USAGE = {
  inputTokens: {
    total: undefined,
    noCache: undefined,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: undefined, text: undefined, reasoning: undefined },
}

const OVERLOADED = {
  code: 'overloaded',
  message: 'The model is overloaded',
  retryable: true,
}

/** Words with their trailing whitespace, the closest cheap stand-in for tokens. */
const tokenize = (text: string) => text.match(/\S+\s*/g) ?? []

const tokenDelayMs = () => 30 + Math.random() * 40

/** Every tool call a script makes, in the order a model would make them. */
const toolCallsOf = ({ components = [], suggestions }: Script) => [
  ...components.map(({ name, props }) => ({ name, input: props as object })),
  ...(suggestions
    ? [{ name: 'suggest_follow_ups', input: { questions: suggestions } }]
    : []),
]

const play = async function* (
  script: Script,
  wait: Wait,
): AsyncGenerator<StreamPart> {
  const { text, failure, firstTokenDelayMs = 0 } = script
  const tokens = tokenize(text)
  const sent = failure ? tokens.slice(0, Math.ceil(tokens.length / 2)) : tokens

  yield { type: 'stream-start', warnings: [] }
  await wait(firstTokenDelayMs)

  if (sent.length > 0) yield { type: 'text-start', id: 'text' }
  for (const token of sent) {
    await wait(tokenDelayMs())
    yield { type: 'text-delta', id: 'text', delta: token }
  }

  // Cut off: no finish arrives, so the SDK reports the answer as interrupted.
  if (failure === 'dropped') return
  if (failure === 'error') {
    yield { type: 'error', error: OVERLOADED }
    return
  }

  if (sent.length > 0) yield { type: 'text-end', id: 'text' }
  for (const [index, call] of toolCallsOf(script).entries()) {
    yield {
      type: 'tool-call',
      toolCallId: `call-${index}`,
      toolName: call.name,
      input: JSON.stringify(call.input),
    }
  }
  yield {
    type: 'finish',
    finishReason: { unified: FINISH_REASONS[script.stop], raw: undefined },
    usage: NO_USAGE,
  }
}

const toStream = <T>(parts: AsyncGenerator<T>) =>
  new ReadableStream<T>({
    pull: async (controller) => {
      const { done, value } = await parts.next()
      if (done) controller.close()
      else controller.enqueue(value)
    },
    cancel: () => void parts.return(undefined),
  })

/**
 * Stands in for the model until a real /iq exists: it plays a script as a
 * model stream, so everything after it is the real AI SDK pipeline.
 */
export const createMockModel = (script: Script, wait: Wait) =>
  new MockLanguageModelV4({
    provider: 'hilbi-mock',
    modelId: 'iq-mock',
    doStream: async () => ({ stream: toStream(play(script, wait)) }),
  })
