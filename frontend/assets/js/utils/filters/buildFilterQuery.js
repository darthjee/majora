/**
 * Build a sparse query object from `[key, value]` field entries, omitting
 * any entry whose value is blank (`''`).
 *
 * @param {Array<[string, string]>} entries - Field entries as `[key, value]` pairs, in the
 *   order they should appear in the resulting query object.
 * @returns {object} Query object with blank fields omitted.
 */
export default function buildFilterQuery(entries) {
  return entries.reduce((query, [key, value]) => {
    if (value !== '') {
      query[key] = value;
    }

    return query;
  }, {});
}
