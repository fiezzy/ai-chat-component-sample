import { type ReactNode } from 'react'

import { Header } from './components'
import s from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

/** The frame every page shares: the header, then the page filling the rest. */
export const Layout = ({ children }: LayoutProps) => (
  <div className={s.layout}>
    <Header />
    <main className={s.main}>{children}</main>
  </div>
)
