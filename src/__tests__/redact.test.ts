import { describe, expect, it } from 'vitest'

import { getMaskingWarning } from '@/features/Chat/components/ChatInput/lib/getMaskingWarning'
import { splitMasked } from '@/features/Chat/components/MessageList/components/UserMessage/lib/splitMasked'
import { redact } from '@/shared/lib/privacy'

describe('redact', () => {
  it.each([
    [
      'email',
      'write to anna.novak+iq@mail.sk please',
      'write to [email] please',
    ],
    ['phone', 'call +421 905 277 308 today', 'call [phone] today'],
    ['phone', 'call 0905 277 308 today', 'call [phone] today'],
    ['birth_number', 'number 850215/1234 here', 'number [birth_number] here'],
    ['card', 'card 4111 1111 1111 1111 ok', 'card [card] ok'],
    ['iban', 'pay SK31 1200 0000 1987 4263 7541 now', 'pay [iban] now'],
    [
      'date_of_birth',
      'I was born on 15.02.1985',
      'I was born on [date_of_birth]',
    ],
    ['date_of_birth', 'DOB: 1985-02-15', 'DOB: [date_of_birth]'],
  ])('masks %s in "%s"', (kind, input, expected) => {
    expect(redact(input)).toEqual({ text: expected, found: [kind] })
  })

  it('reports every masked value', () => {
    const { text, found } = redact('a@b.sk and c@d.cz, 850215/1234')

    expect(text).toBe('[email] and [email], [birth_number]')
    expect(found).toEqual(['email', 'email', 'birth_number'])
  })

  it.each([
    'My HbA1c is 6.1%',
    'Range 4.0-5.6 mmol/L',
    'Blood pressure 120/80',
    'Glucose 5.6, cholesterol 4.9, ferritin 120',
    'My test was on 2024-01-15',
    'I take 500 mg twice a day',
  ])('leaves clinical text alone: "%s"', (input) => {
    expect(redact(input)).toEqual({ text: input, found: [] })
  })

  it('does not change text that is already masked', () => {
    const once = redact('mail a@b.sk').text

    expect(redact(once)).toEqual({ text: once, found: [] })
  })
})

describe('getMaskingWarning', () => {
  it('names one kind', () => {
    expect(getMaskingWarning(['email'])).toBe(
      'Email will be masked before sending.',
    )
  })

  it('names each kind once, in order', () => {
    expect(getMaskingWarning(['email', 'birth_number', 'email'])).toBe(
      'Email and birth number will be masked before sending.',
    )
  })

  it('lists three kinds', () => {
    expect(getMaskingWarning(['email', 'phone', 'iban'])).toBe(
      'Email, phone number and IBAN will be masked before sending.',
    )
  })
})

describe('splitMasked', () => {
  it('separates mask labels from the surrounding text', () => {
    expect(splitMasked('Mail [email] or [phone].')).toEqual([
      { text: 'Mail ', masked: false },
      { text: '[email]', masked: true },
      { text: ' or ', masked: false },
      { text: '[phone]', masked: true },
      { text: '.', masked: false },
    ])
  })

  it('leaves other brackets as plain text', () => {
    expect(splitMasked('See [note]')).toEqual([
      { text: 'See [note]', masked: false },
    ])
  })
})
