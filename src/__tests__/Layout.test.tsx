// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Layout } from '@/features/Layout'

afterEach(cleanup)

describe('Layout', () => {
  it('marks the product as an AI assistant on every page', () => {
    render(<Layout>Page</Layout>)

    expect(screen.getByRole('heading', { name: 'Hilbi IQ' })).toBeTruthy()
    expect(screen.getByText('AI assistant')).toBeTruthy()
  })

  it('renders the page inside the main landmark', () => {
    render(<Layout>Page</Layout>)

    expect(screen.getByRole('main').textContent).toBe('Page')
  })
})
