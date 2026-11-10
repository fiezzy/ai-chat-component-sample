import { handleIq } from '@/server/iq'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const POST = (request: Request) => handleIq(request)
