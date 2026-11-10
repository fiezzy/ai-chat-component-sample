import {
  DropletIcon,
  HeartPulseIcon,
  ScanIcon,
  StethoscopeIcon,
} from '@/shared/ui/icons'

export const SUGGESTIONS = [
  {
    topic: 'Lab results',
    question: 'What does an HbA1c of 6.1% mean?',
    Icon: DropletIcon,
  },
  {
    topic: 'Test preparation',
    question: 'How do I prepare for an MRI?',
    Icon: ScanIcon,
  },
  {
    topic: 'Symptoms',
    question: 'I have chest pain. What should I do?',
    Icon: HeartPulseIcon,
  },
  {
    topic: 'Diagnosis',
    question: 'Can you diagnose my fatigue?',
    Icon: StethoscopeIcon,
  },
]
