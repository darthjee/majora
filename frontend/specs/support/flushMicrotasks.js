/**
 * Flushes a handful of pending microtasks, letting already-settled
 * promise chains (that do not depend on a timer) fully resolve.
 *
 * @param {number} [times] - number of microtask ticks to flush.
 * @returns {Promise<void>} resolves once every flush tick has run.
 */
export default async function flushMicrotasks(times = 5) {
  for (let i = 0; i < times; i += 1) {
    try {
      await Promise.resolve();
    } catch {
      // eslint-disable-next-line security-node/detect-unhandled-async-errors -- Promise.resolve() never rejects; this catch exists only to flush pending microtasks in specs.
    }
  }
}
