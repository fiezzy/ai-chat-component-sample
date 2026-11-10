/**
 * Public surface of the API layer for client code.
 *
 * Server code imports `./iq/types` and `./errors` directly, so it never
 * pulls in the client transport.
 */
export { readApiError } from './errors'

export { iqTransport } from './iq'
export type {
  CareActionProps,
  IqComponent,
  IqMetadata,
  IqUIMessage,
  LabResultProps,
  PrepChecklistProps,
  SafetyNoticeProps,
} from './iq'
