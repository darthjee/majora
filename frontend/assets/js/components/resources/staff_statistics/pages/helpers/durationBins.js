/**
 * Duration histogram bin label keys, indexed by the bin's `lower` bound in seconds (issue #1514).
 *
 * @description Each key resolves under `staff_statistics_page.duration.bins.*`. The backend
 *   always returns the same 8 bins, so the mapping is fixed.
 */
export const DURATION_BIN_KEYS = Object.freeze({
  0: 'zero',
  1: 'under_30s',
  30: '30s_1m',
  60: '1m_3m',
  180: '3m_10m',
  600: '10m_30m',
  1800: '30m_1h',
  3600: 'over_1h',
});

/**
 * Resolves the label key of a duration histogram bin.
 *
 * @description Looks the bin's lower bound up in `DURATION_BIN_KEYS`.
 * @param {number} lower - The bin's lower bound, in seconds.
 * @returns {string|null} The bin label key, or `null` for an unknown bound.
 */
export function durationBinKey(lower) {
  return DURATION_BIN_KEYS[lower] || null;
}
