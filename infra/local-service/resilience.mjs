export async function withRetry(operation, { attempts = 3, delayMs = 0 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(attempt) } catch (error) { lastError = error; if (attempt < attempts && delayMs) await new Promise(resolve => setTimeout(resolve, delayMs)) }
  }
  throw lastError
}

export function createCircuitBreaker({ failureThreshold = 3, resetAfterMs = 30_000 } = {}) {
  let failures = 0
  let openedAt = 0
  return {
    canRequest() { return !openedAt || Date.now() - openedAt >= resetAfterMs },
    recordSuccess() { failures = 0; openedAt = 0 },
    recordFailure() { failures += 1; if (failures >= failureThreshold) openedAt = Date.now() },
    state() { return openedAt && Date.now() - openedAt < resetAfterMs ? 'open' : 'closed' },
  }
}
