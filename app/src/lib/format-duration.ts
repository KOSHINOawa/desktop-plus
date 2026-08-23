type TimeUnitDescriptor = {
  shortUnit: string
  longUnit: string
  ms: number
}

const units: TimeUnitDescriptor[] = [
  { shortUnit: 'd', longUnit: '天', ms: 86400000 },
  { shortUnit: 'h', longUnit: '小时', ms: 3600000 },
  { shortUnit: 'm', longUnit: '分钟', ms: 60000 },
  { shortUnit: 's', longUnit: '秒', ms: 1000 },
]

/**
 * Creates a narrow style precise duration format used for displaying things
 * like check run durations that typically only last for a few minutes.
 *
 * Example: formatPreciseDuration(3670000) -> "1h 1m 10s"
 *
 * @param ms The duration in milliseconds
 */
export const formatPreciseDuration = (ms: number) => {
  const parts = new Array<string>()
  ms = Math.abs(ms)

  for (const unit of units) {
    if (parts.length > 0 || ms >= unit.ms || unit.shortUnit === 's') {
      const qty = Math.floor(ms / unit.ms)
      ms -= qty * unit.ms
      parts.push(`${qty}${unit.shortUnit}`)
    }
  }

  return parts.join(' ')
}

/**
 * Creates a long style precise duration format used for displaying things
 * like check run durations that typically only last for a few minutes.
 *
 * Example: formatLongPreciseDuration(3670000) -> "1 hour 1 minute 10 seconds"
 *
 * @param ms The duration in milliseconds
 */
export const formatLongPreciseDuration = (ms: number) => {
  const parts = new Array<string>()
  ms = Math.abs(ms)

  for (const unit of units) {
    if (parts.length > 0 || ms >= unit.ms || unit.shortUnit === 's') {
      const qty = Math.floor(ms / unit.ms)
      ms -= qty * unit.ms
      parts.push(`${qty} ${unit.longUnit}`)
    }
  }

  return parts.join(' ')
}
