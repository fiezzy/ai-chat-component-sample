import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// script-src stays unset: Next inlines bootstrap scripts, and the rule that
// matters here is connect-src, which stops the page calling anything but /iq.
const contentSecurityPolicy = [
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  ...(isDev
    ? []
    : [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains',
        },
      ]),
]

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  headers: async () => [{ source: '/:path*', headers: securityHeaders }],
}

export default nextConfig
