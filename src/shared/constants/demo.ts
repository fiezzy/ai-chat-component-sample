/** Failure modes the mock gateway can play, for the demo panel and commands. */
export const IQ_DEMO_SCENARIOS = [
  'slow',
  'rate_limited',
  'unavailable',
  'mid_stream_error',
  'dropped',
  'empty',
] as const

export type DemoScenario = (typeof IQ_DEMO_SCENARIOS)[number]
