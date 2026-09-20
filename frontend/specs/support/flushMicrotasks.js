/**
 * Flushes a handful of pending microtasks, letting already-settled
 * promise chains (that do not depend on a timer) fully resolve.
 *
 * @param {number} [times] - number of microtask ticks to flush.
 * @returns {Promise<void>} resolves once every flush tick has run.
 */
export default function flushMicrotasks(times = 5) {
  let chain = Promise.resolve();
  for (let i = 0; i < times; i += 1) {
    chain = chain.then(() => undefined);
  }
  return chain;
}
