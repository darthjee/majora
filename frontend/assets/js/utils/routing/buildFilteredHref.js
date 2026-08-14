/**
 * Build a hash URL applying the given filters, resetting pagination to page 1.
 *
 * @description An array value (e.g. the STL model filters bar's multi-value `race`/`roles`/
 *   `source`/`collection`/`tags` field) is serialized as one repeated query entry per array
 *   element (`params.append(key, v)`), instead of being joined into a single comma-separated
 *   value — the pitfall of building the `URLSearchParams` directly from an object containing an
 *   array (`new URLSearchParams({..., race: ['elf', 'orc']})` stringifies the array via
 *   `String()`, producing `race=elf%2Corc` rather than a repeated `race` param). A scalar value
 *   keeps the existing behavior, unaffected by this branch.
 * @param {string} basePath - Base hash path (e.g. `#/games/demo/treasures`).
 * @param {object} filters - Filters to apply, as built by a `*FiltersController#buildQuery`
 *   (blank/empty fields already omitted).
 * @returns {string} Hash including the reset page and the active filters.
 */
export default function buildFilteredHref(basePath, filters) {
  const params = new URLSearchParams();
  params.set('page', '1');

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
      return;
    }

    params.set(key, value);
  });

  return `${basePath}?${params.toString()}`;
}
