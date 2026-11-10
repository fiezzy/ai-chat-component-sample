import { useCallback, useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion'

const PINNED_THRESHOLD_PX = 80

/**
 * Follows new content, unless the reader has scrolled up to read. Inactive
 * while there is no conversation, so the empty screen opens at its top.
 */
export const useStickToBottom = (active: boolean) => {
  const activeRef = useRef(active)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)
  const lastScrollTopRef = useRef(0)
  const [isPinned, setIsPinned] = useState(true)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    activeRef.current = active
  }, [active])

  const setPinned = useCallback((pinned: boolean) => {
    pinnedRef.current = pinned
    setIsPinned(pinned)
  }, [])

  const scrollToEnd = useCallback(() => {
    const scroller = scrollRef.current
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  }, [])

  const jumpToLatest = useCallback(() => {
    const scroller = scrollRef.current
    setPinned(true)

    if (reducedMotion || !scroller) return scrollToEnd()
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }, [reducedMotion, scrollToEnd, setPinned])

  // Only a move up counts as the reader taking over. A smooth scroll passes
  // through positions far from the end too, but it always moves down.
  const handleScroll = () => {
    const scroller = scrollRef.current
    if (!scroller) return

    const { scrollHeight, scrollTop, clientHeight } = scroller
    const isNearEnd =
      scrollHeight - scrollTop - clientHeight < PINNED_THRESHOLD_PX
    const movedUp = scrollTop < lastScrollTopRef.current
    lastScrollTopRef.current = scrollTop

    if (isNearEnd) setPinned(true)
    else if (movedUp) setPinned(false)
  }

  useEffect(() => {
    const scroller = scrollRef.current
    const content = contentRef.current
    if (!scroller || !content) return

    const observer = new ResizeObserver(() => {
      if (activeRef.current && pinnedRef.current) scrollToEnd()
    })

    // The content grows as the answer streams; the viewport shrinks when
    // something appears below it, such as the follow-up row.
    // border-box, so that padding changes count too.
    observer.observe(content, { box: 'border-box' })
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [scrollToEnd])

  return { scrollRef, contentRef, isPinned, handleScroll, jumpToLatest }
}
