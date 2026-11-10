import { PII_KINDS } from '@/shared/lib/privacy'

const MASK_LABEL = new RegExp(`(\\[(?:${PII_KINDS.join('|')})\\])`)

/** Splits masked text so that the labels can be styled apart from it. */
export const splitMasked = (text: string) =>
  text
    .split(MASK_LABEL)
    .filter(Boolean)
    .map((part) => ({ text: part, masked: MASK_LABEL.test(part) }))
