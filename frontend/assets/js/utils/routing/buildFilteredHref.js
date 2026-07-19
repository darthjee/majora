/**
 * Build a hash URL applying the given filters, resetting pagination to page 1.
 *
 * @param {string} basePath - Base hash path (e.g. `#/games/demo/treasures`).
 * @param {object} filters - Filters to apply, as built by a `*FiltersController#buildQuery`
 *   (blank fields already omitted).
 * @returns {string} Hash including the reset page and the active filters.
 */
export default function buildFilteredHref(basePath, filters) {
  const params = new URLSearchParams({ page: '1', ...filters });
  return `${basePath}?${params.toString()}`;
}
