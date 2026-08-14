/**
 * Build a sparse query object from `[key, value]` field entries, omitting any entry whose value
 * is blank (`''`) or, for an array value (a multi-value filter field, e.g. a picked `race`/
 * `roles`/`source`/`collection`/`tags` list), empty (`value.length === 0`) — a non-empty array is
 * kept as-is, flowing through as an array into `GenericClient#buildIndexParams`'s array branch.
 *
 * @param {Array<[string, string|Array]>} entries - Field entries as `[key, value]` pairs, in the
 *   order they should appear in the resulting query object.
 * @returns {object} Query object with blank/empty fields omitted.
 */
export default function buildFilterQuery(entries) {
  return entries.reduce((query, [key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        query[key] = value;
      }

      return query;
    }

    if (value !== '') {
      query[key] = value;
    }

    return query;
  }, {});
}
