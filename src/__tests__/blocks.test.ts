import { describe, expect, it } from 'vitest'

import { filterCommands } from '@/features/Chat/components/ChatInput/lib/filterCommands'
import { getLabScale } from '@/features/Chat/components/MessageList/components/AssistantMessage/components/GenerativeUI/components/LabResult/lib/getLabScale'
import { getLabStatus } from '@/features/Chat/components/MessageList/components/AssistantMessage/components/GenerativeUI/components/LabResult/lib/getLabStatus'
import { balanceMarkdown } from '@/features/Chat/components/MessageList/components/AssistantMessage/components/Markdown/lib/balanceMarkdown'
import { getAnswerPhase } from '@/features/Chat/components/MessageList/components/AssistantMessage/lib/getAnswerPhase'
import { getBlocksLength } from '@/features/Chat/lib/getBlocksLength'
import { getFollowUps } from '@/features/Chat/lib/getFollowUps'
import { type Block, type Message } from '@/features/Chat/types'

const component: Block = {
  kind: 'component',
  id: 'c',
  component: { name: 'safety_notice', props: { level: 'urgent', text: 'Go' } },
}
const text = (id: string, value: string): Block => ({
  kind: 'text',
  id,
  text: value,
})

describe('getBlocksLength', () => {
  it('counts text by characters and a component as one', () => {
    expect(
      getBlocksLength([text('a', 'Hello there'), component, text('b', 'Bye')]),
    ).toBe(15)
  })
})

describe('balanceMarkdown', () => {
  it('closes an unfinished bold run', () => {
    expect(balanceMarkdown('This is **impor')).toBe('This is **impor**')
  })

  it('leaves balanced text alone', () => {
    expect(balanceMarkdown('This is **done** now')).toBe('This is **done** now')
  })

  it('drops a dangling opener with nothing after it', () => {
    expect(balanceMarkdown('This is **')).toBe('This is ')
  })
})

describe('getLabStatus', () => {
  it.each([
    [3, 'below'],
    [4, 'in_range'],
    [5.6, 'in_range'],
    [6.1, 'above'],
  ] as const)('classifies %d', (value, status) => {
    expect(getLabStatus({ value, low: 4, high: 5.6 })).toBe(status)
  })
})

describe('getLabScale', () => {
  it('centres the reference range on the track', () => {
    expect(getLabScale({ value: 5, low: 4, high: 6 })).toEqual({
      lowPercent: 25,
      highPercent: 75,
      valuePercent: 50,
    })
  })

  it('pins a value beyond the track to its edge', () => {
    expect(getLabScale({ value: 99, low: 4, high: 6 }).valuePercent).toBe(100)
    expect(getLabScale({ value: -9, low: 4, high: 6 }).valuePercent).toBe(0)
  })
})

describe('getFollowUps', () => {
  const answer = (status: 'complete' | 'failed'): Message => ({
    id: 'a',
    role: 'assistant',
    status,
    blocks: [text('t', 'Hi')],
    suggestions: ['Why?'],
  })

  it('offers the follow-ups of a completed last answer', () => {
    expect(getFollowUps([answer('complete')], false)).toEqual(['Why?'])
  })

  it('offers nothing while an answer is in progress', () => {
    expect(getFollowUps([answer('complete')], true)).toEqual([])
  })

  it('offers nothing after a failed answer', () => {
    expect(getFollowUps([answer('failed')], false)).toEqual([])
  })
})

describe('filterCommands', () => {
  const commands = [
    { name: 'empty', description: 'Empty answer' },
    { name: 'echo', description: 'Echo' },
    { name: 'slow', description: 'Slow' },
  ]

  it('lists every command for a bare slash', () => {
    expect(filterCommands(commands, '/').map((c) => c.name)).toEqual([
      'empty',
      'echo',
      'slow',
    ])
  })

  it('narrows the list by prefix', () => {
    expect(filterCommands(commands, '/e').map((c) => c.name)).toEqual([
      'empty',
      'echo',
    ])
  })

  it('offers nothing once the text stops being a single command', () => {
    expect(filterCommands(commands, '/empty now')).toEqual([])
    expect(filterCommands(commands, 'hello /e')).toEqual([])
  })

  it('offers nothing when no command matches', () => {
    expect(filterCommands(commands, '/zzz')).toEqual([])
  })
})

describe('getAnswerPhase', () => {
  it('thinks until the first content arrives, then writes', () => {
    expect(getAnswerPhase('pending', false)).toBe('thinking')
    expect(getAnswerPhase('streaming', false)).toBe('thinking')
    expect(getAnswerPhase('streaming', true)).toBe('writing')
  })

  it('shows how a finished answer ended', () => {
    expect(getAnswerPhase('complete', true)).toBe('complete')
    expect(getAnswerPhase('failed', true)).toBe('failed')
    expect(getAnswerPhase('resuming', true)).toBe('resuming')
  })
})
