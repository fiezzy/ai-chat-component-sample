// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Thinking } from '@/features/Chat/components/MessageList/components/AssistantMessage/components'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Thinking', () => {
  it('adds a line once the wait gets long', () => {
    vi.useFakeTimers()
    render(<Thinking />)

    expect(screen.getByText('Thinking')).toBeTruthy()
    expect(screen.queryByText('Still working on your answer')).toBeNull()

    act(() => vi.advanceTimersByTime(8000))

    expect(screen.getByText('Still working on your answer')).toBeTruthy()
  })
})
