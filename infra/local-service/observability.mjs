const counters = new Map()

export function incrementMetric(name, value = 1) {
  counters.set(name, (counters.get(name) || 0) + value)
}

export function metricsSnapshot() {
  return Object.fromEntries(counters.entries())
}

export function resetMetrics() {
  counters.clear()
}
