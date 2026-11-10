interface LabReading {
  value: number
  low: number
  high: number
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

/** Lays out a track with the reference range in its middle half. */
export const getLabScale = ({ value, low, high }: LabReading) => {
  const span = high - low
  const start = low - span / 2
  const toPercent = (point: number) =>
    clampPercent(((point - start) / (span * 2)) * 100)

  return {
    lowPercent: toPercent(low),
    highPercent: toPercent(high),
    valuePercent: toPercent(value),
  }
}
