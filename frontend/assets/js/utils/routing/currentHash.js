/**
 * Read the current browser location hash, SSR-safe.
 *
 * @returns {string} The current `window.location.hash`, or `''` when
 *   `window` is not defined (e.g. during server-side rendering).
 */
export default function getCurrentHash() {
  return typeof window === 'undefined' ? '' : window.location.hash;
}
