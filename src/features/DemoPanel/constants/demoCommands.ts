import { type ChatCommand } from '@/features/Chat'
import { IQ_DEMO_SCENARIOS, type DemoScenario } from '@/shared/constants/demo'

const DESCRIPTIONS: Record<DemoScenario, string> = {
  slow: 'Wait 9 seconds before the first word',
  rate_limited: 'Reject the request as too many',
  unavailable: 'Reject the request as unavailable',
  mid_stream_error: 'Fail partway through the answer',
  dropped: 'Cut the connection mid-answer',
  empty: 'Return an answer with no content',
}

/** The mock's scenarios, offered in the chat as slash commands. */
export const DEMO_COMMANDS: ChatCommand[] = IQ_DEMO_SCENARIOS.map((name) => ({
  name,
  description: DESCRIPTIONS[name],
}))
