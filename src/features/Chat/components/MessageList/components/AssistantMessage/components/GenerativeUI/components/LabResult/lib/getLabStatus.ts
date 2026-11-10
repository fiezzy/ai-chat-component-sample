export type LabStatus = 'below' | 'in_range' | 'above'

interface LabReading {
  value: number
  low: number
  high: number
}

export const getLabStatus = ({ value, low, high }: LabReading): LabStatus => {
  if (value < low) return 'below'
  return value > high ? 'above' : 'in_range'
}
