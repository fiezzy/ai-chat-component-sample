import type { SVGProps } from 'react'
export const AlertCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx={12} cy={12} r={9.25} stroke="currentColor" strokeWidth={1.75} />
    <path
      d="M12 7.5V13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2}
    />
    <circle cx={12} cy={16.5} fill="currentColor" r={1.15} />
  </svg>
)
