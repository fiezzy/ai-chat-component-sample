import type { SVGProps } from 'react'
export const DropletIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 3S6 9.6 6 14a6 6 0 0 0 12 0c0-4.4-6-11-6-11" />
    <path d="M9.5 14.5A2.5 2.5 0 0 0 12 17" />
  </svg>
)
