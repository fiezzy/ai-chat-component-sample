import { type CareActionProps } from '@/shared/api'
import { CareLinks } from '@/shared/constants/links'

export const CARE_ACTIONS: Record<
  CareActionProps['action'],
  { label: string; href: string }
> = {
  book_gp: { label: 'Book a GP consultation', href: CareLinks.BookGp },
  book_lab: { label: 'Book a lab test', href: CareLinks.BookLab },
  second_opinion: {
    label: 'Get a second opinion',
    href: CareLinks.SecondOpinion,
  },
}
