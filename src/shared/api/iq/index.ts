import { DefaultChatTransport } from 'ai'

import { ApiRoutes } from '@/shared/constants/api'

import { type IqUIMessage } from './types'

export type * from './types'

export const iqTransport = new DefaultChatTransport<IqUIMessage>({
  api: ApiRoutes.Iq,
})
