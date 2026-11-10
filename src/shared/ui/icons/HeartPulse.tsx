import type { SVGProps } from 'react'
export const HeartPulseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.75}
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M20.8 8.6A4.8 4.8 0 0 0 12 5.9a4.8 4.8 0 0 0-8.8 2.7c0 5 8.8 11 8.8 11s8.8-6 8.8-11" />
    <path d="M7 12h2.5L11 9.5l2 5 1.5-2.5H17" />
  </svg>
)
