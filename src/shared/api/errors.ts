/** The error envelope every endpoint answers with on a non-2xx status. */
export interface ApiErrorBody {
  code: string
  message: string
  retryable: boolean
}

export const isApiErrorBody = (value: unknown): value is ApiErrorBody => {
  const body = value as Partial<ApiErrorBody> | null | undefined
  return (
    typeof body?.code === 'string' &&
    typeof body.message === 'string' &&
    typeof body.retryable === 'boolean'
  )
}

/**
 * Reads the envelope back from a chat error. The transport puts an HTTP
 * error body into `message`, and the gateway sends stream errors the same way.
 */
export const readApiError = (error: Error): ApiErrorBody | null => {
  try {
    const { error: body } = JSON.parse(error.message)
    return isApiErrorBody(body) ? body : null
  } catch {
    return null
  }
}
