import type { SVGProps } from 'react'
export const ScanIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx={12} cy={12} r={8.5} />
    <circle cx={12} cy={12} r={3.5} />
    <path d="M3.5 19.5h17" />
  </svg>
)
