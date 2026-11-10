import { type IqComponent } from '@/shared/api'

export interface UserMessage {
  id: string
  role: 'user'
  text: string
  maskedCount: number
}

export type AssistantStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'truncated'
  | 'refused'
  | 'stopped'
  | 'failed'
  | 'resuming'

interface TextBlock {
  kind: 'text'
  id: string
  text: string
}

interface ComponentBlock {
  kind: 'component'
  id: string
  component: IqComponent
}

export type Block = TextBlock | ComponentBlock

export interface AssistantError {
  message: string
  retryable: boolean
}

export interface AssistantMessage {
  id: string
  role: 'assistant'
  blocks: Block[]
  status: AssistantStatus
  error?: AssistantError
  /** Follow-up questions the model offered with this answer. */
  suggestions?: string[]
}

export type Message = UserMessage | AssistantMessage
