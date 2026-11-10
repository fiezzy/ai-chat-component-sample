import type { SVGProps } from 'react'
export const StethoscopeIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M5 3v5a4 4 0 0 0 8 0V3" />
    <path d="M9 12v2.5a5 5 0 0 0 10 0V13" />
    <circle cx={19} cy={11} r={2} />
  </svg>
)
