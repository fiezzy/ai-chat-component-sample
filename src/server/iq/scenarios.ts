import { type ApiErrorBody } from '@/shared/api/errors'
import { type IqComponent, type IqUIMessage } from '@/shared/api/iq/types'
import { IQ_DEMO_SCENARIOS, type DemoScenario } from '@/shared/constants/demo'

export interface Script {
  text: string
  components?: IqComponent[]
  /** Follow-up questions, sent as a suggest_follow_ups tool call. */
  suggestions?: string[]
  stop: 'complete' | 'truncated' | 'refused'
  /** Ends the stream partway: with an upstream error, or by cutting it. */
  failure?: 'error' | 'dropped'
  firstTokenDelayMs?: number
}

interface Rejection {
  status: number
  error: ApiErrorBody
}

export type Scenario = Script | Rejection

/** A model spends a moment before the first token. The UI shows it as thinking. */
const THINKING_DELAY_MS = 2000

const DEFAULT_TEXT = `I can explain lab results, medical terms and how to prepare for a test.

For example, **cholesterol** is a fat-like substance in your blood. Your body needs it, but high LDL cholesterol can raise your risk of heart disease.

Ask me about a result or a test you have coming up.`

const SCRIPTS = {
  default: {
    text: DEFAULT_TEXT,
    suggestions: ['What is LDL cholesterol?', 'How do I read a blood test?'],
    stop: 'complete',
  },
  lab: {
    text: `**HbA1c** shows your average blood sugar over about three months.

Your value is slightly above the usual range. One result is not a diagnosis. Your doctor will read it with your history and other tests.

Your doctor may also look at:

- Your fasting glucose
- Your family history
- Your diet, activity and weight
`,
    components: [
      {
        name: 'lab_result',
        props: { test: 'HbA1c', value: 6.1, unit: '%', low: 4, high: 5.6 },
      },
      {
        name: 'care_action',
        props: {
          action: 'book_gp',
          reason: 'Go through this result with a doctor.',
        },
      },
    ],
    suggestions: [
      'What is prediabetes?',
      'How can I lower my HbA1c?',
      'How often should I test it?',
    ],
    stop: 'complete',
  },
  prep: {
    text: 'An MRI scanner uses a strong magnet, so metal stays outside the room. The scan is painless and often takes 20 to 60 minutes. Follow your clinic if its instructions differ.',
    components: [
      {
        name: 'prep_checklist',
        props: {
          title: 'Before your MRI',
          steps: [
            'Tell the clinic about any implant, pacemaker or metal in your body',
            'Mention pregnancy or kidney problems',
            'Ask if you need to stop eating before the scan',
            'Remove jewellery, watches and hairpins',
            'Wear comfortable clothes without metal',
          ],
        },
      },
    ],
    suggestions: ['Can I eat before an MRI?', 'Is an MRI safe with a tattoo?'],
    stop: 'complete',
  },
  safety: {
    text: 'Chest pain can be a sign of a serious problem. Treat it as urgent.',
    components: [
      {
        name: 'safety_notice',
        props: {
          level: 'emergency',
          text: 'Get help now if the pain is severe, spreads to your arm or jaw, or comes with shortness of breath or sweating.',
        },
      },
      {
        name: 'care_action',
        props: {
          action: 'book_gp',
          reason:
            'If the pain was mild and has passed, still see a doctor soon.',
        },
      },
    ],
    suggestions: ['What else can cause chest pain?'],
    stop: 'complete',
  },
  refusal: {
    text: 'I cannot give a diagnosis or advise on doses. A doctor can review your symptoms and your history.',
    components: [
      {
        name: 'care_action',
        props: { action: 'book_gp', reason: 'Talk to a doctor about this.' },
      },
    ],
    suggestions: [
      'What can cause fatigue?',
      'Which blood tests check for fatigue?',
    ],
    stop: 'refused',
  },
  slow: { text: DEFAULT_TEXT, stop: 'complete', firstTokenDelayMs: 9000 },
  mid_stream_error: { text: DEFAULT_TEXT, stop: 'complete', failure: 'error' },
  dropped: { text: DEFAULT_TEXT, stop: 'complete', failure: 'dropped' },
  empty: { text: '', stop: 'complete' },
} satisfies Record<string, Script>

const REJECTIONS = {
  rate_limited: {
    status: 429,
    error: { code: 'rate_limited', message: 'Rate limited', retryable: true },
  },
  unavailable: {
    status: 503,
    error: { code: 'unavailable', message: 'Unavailable', retryable: true },
  },
} satisfies Record<string, Rejection>

const KEYWORDS: [RegExp, keyof typeof SCRIPTS][] = [
  [/chest pain/i, 'safety'],
  [/diagnos|\bdos(e|age)\b/i, 'refusal'],
  [/hba1c|blood test|lab result/i, 'lab'],
  [/\bmri\b|prepare/i, 'prep'],
]

const isDemoScenario = (name: string | null): name is DemoScenario =>
  IQ_DEMO_SCENARIOS.some((scenario) => scenario === name)

const pickScript = (question: string, forced: string | null): Script => {
  if (isDemoScenario(forced) && forced in SCRIPTS) {
    return SCRIPTS[forced as keyof typeof SCRIPTS]
  }

  const match = KEYWORDS.find(([pattern]) => pattern.test(question))
  return SCRIPTS[match?.[1] ?? 'default']
}

/** A continuation needs no thinking pause, but the button loader should show. */
const RESUME_DELAY_MS = 1200

/**
 * Finishes an answer the client already has the start of, the way a model
 * continues a prefilled assistant turn. It never fails again, so a retry in a
 * failing demo scenario shows the recovery.
 */
export const continueScript = (script: Script, partial: string): Script => ({
  ...script,
  text: script.text.startsWith(partial)
    ? script.text.slice(partial.length)
    : '',
  failure: undefined,
  firstTokenDelayMs: RESUME_DELAY_MS,
})

/** "/empty" in the chat runs the empty scenario, without the demo panel. */
const readCommand = (question: string) =>
  question.trim().match(/^\/([a-z_]+)$/)?.[1] ?? null

/** The plain text of a message, the only part a script reacts to. */
export const textOf = (message: IqUIMessage) =>
  message.parts
    .flatMap((part) => (part.type === 'text' ? part.text : []))
    .join('')

export const selectScenario = (
  messages: IqUIMessage[],
  forced: string | null,
): Scenario => {
  const user = messages.findLast((message) => message.role === 'user')
  const question = user ? textOf(user) : ''
  const requested = forced ?? readCommand(question)

  if (requested === 'rate_limited' || requested === 'unavailable') {
    return REJECTIONS[requested]
  }

  return {
    firstTokenDelayMs: THINKING_DELAY_MS,
    ...pickScript(question, requested),
  }
}
