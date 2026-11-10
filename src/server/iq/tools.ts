import { tool, type Tool } from 'ai'
import { z } from 'zod'

import { type IqUITools } from '@/shared/api/iq/types'

/**
 * Display-only: the call's input is the payload, and the client renders it.
 * The result is a stub, because a call without one would be invalid history
 * on the next turn.
 */
const shown = async () => 'shown'

/**
 * The closed catalog: a model picks a tool and sends data, never markup. The
 * model sees these schemas as tool arguments, and the SDK validates every call
 * against them before it reaches the client.
 */
export const iqTools = {
  lab_result: tool({
    description: 'Show a lab value against its reference range',
    inputSchema: z.object({
      test: z.string(),
      value: z.number(),
      unit: z.string(),
      low: z.number(),
      high: z.number(),
    }),
    execute: shown,
  }),
  care_action: tool({
    description: 'Offer a next step with a doctor',
    inputSchema: z.object({
      action: z.enum(['book_gp', 'book_lab', 'second_opinion']),
      reason: z.string(),
    }),
    execute: shown,
  }),
  safety_notice: tool({
    description: 'Warn about a symptom that needs care soon',
    inputSchema: z.object({
      level: z.enum(['urgent', 'emergency']),
      text: z.string(),
    }),
    execute: shown,
  }),
  prep_checklist: tool({
    description: 'List the steps to prepare for a test',
    inputSchema: z.object({
      title: z.string(),
      steps: z.array(z.string()).min(1),
    }),
    execute: shown,
  }),
  suggest_follow_ups: tool({
    description: 'Offer follow-up questions for the next turn',
    inputSchema: z.object({
      questions: z.array(z.string().min(1).max(120)).min(1).max(3),
    }),
    execute: shown,
  }),
  // Fails to compile if the catalog and the client's contract drift apart.
} satisfies {
  [Name in keyof IqUITools]: Tool<
    IqUITools[Name]['input'],
    IqUITools[Name]['output']
  >
}
