import { type FinishReason, type UIMessage } from 'ai'

// The /iq contract as the client sees it. Validation runs at the gateway, so
// the client needs only types.

export interface LabResultProps {
  test: string
  value: number
  unit: string
  low: number
  high: number
}

export interface CareActionProps {
  action: 'book_gp' | 'book_lab' | 'second_opinion'
  reason: string
}

export interface SafetyNoticeProps {
  level: 'urgent' | 'emergency'
  text: string
}

export interface PrepChecklistProps {
  title: string
  steps: string[]
}

export interface FollowUpsProps {
  questions: string[]
}

export type IqComponent =
  | { name: 'lab_result'; props: LabResultProps }
  | { name: 'care_action'; props: CareActionProps }
  | { name: 'safety_notice'; props: SafetyNoticeProps }
  | { name: 'prep_checklist'; props: PrepChecklistProps }

export type IqUITools = {
  lab_result: { input: LabResultProps; output: string }
  care_action: { input: CareActionProps; output: string }
  safety_notice: { input: SafetyNoticeProps; output: string }
  prep_checklist: { input: PrepChecklistProps; output: string }
  suggest_follow_ups: { input: FollowUpsProps; output: string }
}

export interface IqMetadata {
  aiGenerated?: true
  finishReason?: FinishReason
  stopped?: true
  maskedCount?: number
}

export type IqUIMessage = UIMessage<IqMetadata, never, IqUITools>
