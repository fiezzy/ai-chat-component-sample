import { Badge } from '@/shared/ui/Badge'

import s from './Header.module.css'

export const Header = () => (
  <header className={s.header}>
    <h1 className={s.title}>Hilbi IQ</h1>
    <Badge>AI assistant</Badge>
  </header>
)
