export const PII_KINDS = [
  'email',
  'iban',
  'birth_number',
  'date_of_birth',
  'card',
  'phone',
] as const

export type PiiKind = (typeof PII_KINDS)[number]

const DATE = String.raw`\d{1,4}[./-]\d{1,2}[./-]\d{1,4}|\d{1,2}\s+[a-z]+\s+\d{4}`
const BIRTH_CONTEXT = String.raw`\b(?:born|dob|date of birth)\b[^\d\n]{0,20}`

const RULES: { kind: PiiKind; pattern: RegExp }[] = [
  { kind: 'email', pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
  {
    kind: 'iban',
    pattern: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/g,
  },
  { kind: 'birth_number', pattern: /\b\d{6}\/\d{3,4}\b/g },
  {
    kind: 'date_of_birth',
    pattern: new RegExp(`(?<=${BIRTH_CONTEXT})(?:${DATE})`, 'gi'),
  },
  { kind: 'card', pattern: /\b\d(?:[ -]?\d){12,18}\b/g },
  {
    kind: 'phone',
    pattern: /\+\d(?:[ -]?\d){7,13}\b|\b0\d{2,3}[ -]?\d{3}[ -]?\d{3}\b/g,
  },
]

export interface RedactResult {
  text: string
  found: PiiKind[]
}

/**
 * Best-effort and one-way. It catches structured identifiers only, so it
 * lowers risk without de-identifying the text: names in free text pass through.
 */
export const redact = (input: string): RedactResult => {
  const found: PiiKind[] = []

  const text = RULES.reduce(
    (current, { kind, pattern }) =>
      current.replace(pattern, () => {
        found.push(kind)
        return `[${kind}]`
      }),
    input,
  )

  return { text, found }
}
