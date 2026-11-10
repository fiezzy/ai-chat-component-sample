const ERROR_MESSAGES: Record<string, string> = {
  rate_limited:
    'Too many questions in a short time. Wait a moment, then try again.',
  unavailable: 'Hilbi IQ is unavailable right now. Try again in a minute.',
  overloaded: 'Response interrupted. Hilbi IQ is busy, so try again.',
  interrupted: 'Response interrupted. The connection dropped before the end.',
  network: 'Could not reach Hilbi IQ. Check your connection, then try again.',
  invalid_request:
    'This message could not be sent. Shorten it and send it again.',
}

export const EMPTY_ANSWER_MESSAGE = 'No answer was returned.'

const FALLBACK_MESSAGE = 'Something went wrong with this answer.'

export const getErrorMessage = (code: string) =>
  ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE
