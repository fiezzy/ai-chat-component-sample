import { type Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { type ReactNode } from 'react'

import { Layout } from '@/features/Layout'

import './globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: '500',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'Hilbi IQ',
  description: 'An AI assistant that explains health information.',
}

interface RootLayoutProps {
  children: ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html className={roboto.variable} lang="en">
    <body>
      <Layout>{children}</Layout>
    </body>
  </html>
)

export default RootLayout
