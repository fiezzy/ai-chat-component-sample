import { type PiiKind } from '@/shared/lib/privacy'

const KIND_LABELS: Record<PiiKind, string> = {
  email: 'email',
  phone: 'phone number',
  birth_number: 'birth number',
  card: 'card number',
  iban: 'IBAN',
  date_of_birth: 'date of birth',
}

const joinLabels = (labels: string[]) =>
  labels.length < 2
    ? labels.join('')
    : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`

/** The warning shown while typing, naming each kind of data about to be masked. */
export const getMaskingWarning = (kinds: PiiKind[]) => {
  const list = joinLabels([...new Set(kinds)].map((kind) => KIND_LABELS[kind]))

  return `${list.charAt(0).toUpperCase()}${list.slice(1)} will be masked before sending.`
}
