// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Chat } from '@/features/Chat'

const encoder = new TextEncoder()

/** One UI message stream chunk, as the AI SDK sends it. */
const chunk = (data: object) => `data: ${JSON.stringify(data)}\n\n`

const streamResponse = (chunks: object[], { close = true } = {}) =>
  new Response(
    new ReadableStream({
      start: (controller) => {
        chunks.forEach((data) =>
          controller.enqueue(encoder.encode(chunk(data))),
        )
        if (close) controller.close()
      },
    }),
    { headers: { 'content-type': 'text/event-stream' } },
  )

const start = { type: 'start', messageMetadata: { aiGenerated: true } }
const finish = {
  type: 'finish',
  finishReason: 'stop',
  messageMetadata: { finishReason: 'stop' },
}
const text = (id: string, value: string) => [
  { type: 'text-start', id },
  { type: 'text-delta', id, delta: value },
  { type: 'text-end', id },
]
const tool = (toolCallId: string, toolName: string, input: object) => [
  { type: 'tool-input-available', toolCallId, toolName, input },
  { type: 'tool-output-available', toolCallId, output: 'shown' },
]

const answer = (value: string) =>
  streamResponse([start, ...text('t', value), finish])

/** The request history, reduced to who said what. */
const historyOf = (call: unknown[]) => {
  const { messages } = JSON.parse((call[1] as RequestInit).body as string)
  return messages.map(
    (message: { role: string; parts: { type: string; text?: string }[] }) => ({
      role: message.role,
      text: message.parts.map((part) => part.text ?? '').join(''),
    }),
  )
}

/** Answer text is split into one span per word, so match the paragraph. */
const paragraph = (text: string) => (_: string, element: Element | null) =>
  element?.tagName === 'P' && element.textContent === text

const ask = async (text: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox'), `${text}{Enter}`)
}

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = vi.fn()
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Chat', () => {
  it('shows suggestions and the AI disclosure before any message', () => {
    render(<Chat />)

    expect(screen.getByRole('button', { name: /HbA1c/ })).toBeTruthy()
    expect(screen.getByText(/does not replace your doctor/)).toBeTruthy()
  })

  it('labels a streamed answer as AI-generated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => answer('Hello there')),
    )
    render(<Chat />)

    await ask('Hi')

    await screen.findByText(paragraph('Hello there'))
    expect(screen.getByText('AI-generated')).toBeTruthy()
    expect(
      document.querySelector('[data-ai-generated="true"]')?.textContent,
    ).toContain('Hello there')
  })

  it('sends masked text and shows the masked version in the chat', async () => {
    const fetchMock = vi.fn(async () => answer('Ok'))
    vi.stubGlobal('fetch', fetchMock)
    render(<Chat />)

    await ask('Mail anna@mail.sk now')

    await screen.findByText(paragraph('Ok'))
    expect(historyOf(fetchMock.mock.calls[0])).toEqual([
      { role: 'user', text: 'Mail [email] now' },
    ])
    expect(document.body.textContent).not.toContain('anna@mail.sk')
    expect(screen.getByText('1 personal detail masked')).toBeTruthy()
  })

  it('sends with the Send button and clears the input', async () => {
    const fetchMock = vi.fn(async () => answer('Ok'))
    vi.stubGlobal('fetch', fetchMock)
    render(<Chat />)
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox'), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await screen.findByText(paragraph('Ok'))
    expect(historyOf(fetchMock.mock.calls[0])).toEqual([
      { role: 'user', text: 'Hi' },
    ])
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('')
  })

  it('breaks the line on Shift+Enter instead of sending', async () => {
    const fetchMock = vi.fn(async () => answer('Ok'))
    vi.stubGlobal('fetch', fetchMock)
    render(<Chat />)
    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox'),
      'One{Shift>}{Enter}{/Shift}Two',
    )

    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
      'One\nTwo',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('warns about personal data while typing', async () => {
    render(<Chat />)
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox'), 'anna@mail.sk')

    expect(
      screen.getByText('Email will be masked before sending.'),
    ).toBeTruthy()
  })

  it('continues an interrupted answer, showing a loader until it resumes', async () => {
    let resume: (response: Response) => void = () => {}
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        streamResponse([
          start,
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', delta: 'Partial answer ' },
        ]),
      )
      .mockReturnValueOnce(new Promise((resolve) => (resume = resolve)))
    vi.stubGlobal('fetch', fetchMock)
    render(<Chat />)

    await ask('Hi')
    const retry = await screen.findByRole('button', { name: 'Try again' })
    await userEvent.setup().click(retry)

    expect(retry.getAttribute('aria-busy')).toBe('true')
    expect((retry as HTMLButtonElement).disabled).toBe(true)
    expect(historyOf(fetchMock.mock.calls[1])).toEqual([
      { role: 'user', text: 'Hi' },
      { role: 'assistant', text: 'Partial answer ' },
    ])

    resume(answer('continues here.'))

    await screen.findByText(paragraph('Partial answer continues here.'))
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('starts over when nothing arrived before the failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { error: { code: 'unavailable', message: 'x', retryable: true } },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(answer('Fresh answer'))
    vi.stubGlobal('fetch', fetchMock)
    render(<Chat />)

    await ask('Hi')
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Try again' }))

    await screen.findByText(paragraph('Fresh answer'))
    expect(historyOf(fetchMock.mock.calls[1])).toEqual([
      { role: 'user', text: 'Hi' },
    ])
  })

  it('shows an error in place of the answer when the request is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error: { code: 'rate_limited', message: 'x', retryable: true } },
          { status: 429 },
        ),
      ),
    )
    render(<Chat />)

    await ask('Hi')

    await screen.findByRole('button', { name: 'Try again' })
    expect(screen.getByText(/Too many questions/)).toBeTruthy()
  })

  it('stops an answer in progress', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url: string, init: RequestInit) =>
          new Response(
            new ReadableStream({
              start: (controller) => {
                controller.enqueue(encoder.encode(chunk(start)))
                init.signal?.addEventListener('abort', () =>
                  controller.error(new DOMException('Aborted', 'AbortError')),
                )
              },
            }),
          ),
      ),
    )
    render(<Chat />)

    await ask('Hi')
    expect(await screen.findByText('Thinking')).toBeTruthy()
    const stop = await screen.findByRole('button', { name: 'Stop' })
    await userEvent.setup().click(stop)

    await waitFor(() => expect(screen.getByText('Stopped')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy()
  })

  it('wraps each revealed word so it can fade in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => answer('Two words')),
    )
    render(<Chat />)

    await ask('Hi')

    await screen.findByText(paragraph('Two words'))
    const words = document.querySelectorAll('[data-ai-generated] p span')
    expect([...words].map((word) => word.textContent)).toEqual([
      'Two ',
      'words',
    ])
  })

  it('offers follow-up questions and sends the one picked', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        streamResponse([
          start,
          ...text('t', 'First'),
          ...tool('s', 'suggest_follow_ups', {
            questions: ['What is prediabetes?'],
          }),
          finish,
        ]),
      )
      .mockResolvedValueOnce(answer('Second'))
    vi.stubGlobal('fetch', fetchMock)
    render(<Chat />)

    await ask('Hi')
    const followUp = await screen.findByRole('button', {
      name: 'What is prediabetes?',
    })
    await userEvent.setup().click(followUp)

    await screen.findByText(paragraph('Second'))
    expect(historyOf(fetchMock.mock.calls[1]).at(-1)).toEqual({
      role: 'user',
      text: 'What is prediabetes?',
    })
  })

  describe('command menu', () => {
    const commands = [
      { name: 'empty', description: 'Return an empty answer' },
      { name: 'echo', description: 'Show what reached the model' },
      { name: 'slow', description: 'Answer slowly' },
    ]
    const optionNames = () =>
      screen.queryAllByRole('option').map((option) => option.textContent)

    it('opens on a slash and narrows as you type', async () => {
      render(<Chat commands={commands} />)
      const user = userEvent.setup()

      await user.type(screen.getByRole('textbox'), '/')
      expect(screen.getAllByRole('option')).toHaveLength(3)

      await user.type(screen.getByRole('textbox'), 'e')
      expect(optionNames()).toEqual([
        '/emptyReturn an empty answer',
        '/echoShow what reached the model',
      ])
    })

    it('sends the highlighted command on Enter', async () => {
      const fetchMock = vi.fn(async () => answer('Ok'))
      vi.stubGlobal('fetch', fetchMock)
      render(<Chat commands={commands} />)
      const user = userEvent.setup()

      await user.type(screen.getByRole('textbox'), '/e{ArrowDown}{Enter}')

      await screen.findByText(paragraph('Ok'))
      expect(historyOf(fetchMock.mock.calls[0])).toEqual([
        { role: 'user', text: '/echo' },
      ])
    })

    it('sends a command when it is clicked', async () => {
      const fetchMock = vi.fn(async () => answer('Ok'))
      vi.stubGlobal('fetch', fetchMock)
      render(<Chat commands={commands} />)
      const user = userEvent.setup()

      await user.type(screen.getByRole('textbox'), '/')
      await user.click(screen.getByRole('option', { name: /slow/ }))

      await screen.findByText(paragraph('Ok'))
      expect(historyOf(fetchMock.mock.calls[0])).toEqual([
        { role: 'user', text: '/slow' },
      ])
    })

    it('closes on Escape', async () => {
      render(<Chat commands={commands} />)
      const user = userEvent.setup()

      await user.type(screen.getByRole('textbox'), '/{Escape}')

      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('stays hidden without commands', async () => {
      render(<Chat />)
      const user = userEvent.setup()

      await user.type(screen.getByRole('textbox'), '/')

      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  it('renders a component block from the catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        streamResponse([
          start,
          ...tool('c', 'lab_result', {
            test: 'HbA1c',
            value: 6.1,
            unit: '%',
            low: 4,
            high: 5.6,
          }),
          finish,
        ]),
      ),
    )
    render(<Chat />)

    await ask('Hi')

    await screen.findByText('Above range')
  })
})
