/**
 * Appends the string values of `value` (a string or an array) to `codes`.
 * @param {string[]} codes - Accumulator.
 * @param {unknown} value - A string, an array of strings, or anything else (ignored).
 */
function collect(codes, value) {
  const values = Array.isArray(value) ? value : [value];

  values.forEach((item) => {
    if (typeof item === 'string' && !codes.includes(item)) {
      codes.push(item);
    }
  });
}

/**
 * Tells whether `value` is a plain (non-array) object.
 * @param {unknown} value - Any value.
 * @returns {boolean} `true` for non-null, non-array objects.
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Flattens every error code found in an API response body.
 *
 * Codes are read, in order, from `errors.<field>[]` (including `errors.detail[]`),
 * `detail`, `error` and `reason`. Duplicates are dropped. Bodies that are not objects
 * (raw text, `null`, arrays) yield no code.
 * @param {unknown} body - The parsed response body, or its raw text.
 * @returns {string[]} The codes, in the order found.
 */
export function extractCodes(body) {
  const codes = [];

  if (!isObject(body)) {
    return codes;
  }

  if (isObject(body.errors)) {
    Object.values(body.errors).forEach((value) => collect(codes, value));
  } else {
    collect(codes, body.errors);
  }

  collect(codes, body.detail);
  collect(codes, body.error);
  collect(codes, body.reason);

  return codes;
}
