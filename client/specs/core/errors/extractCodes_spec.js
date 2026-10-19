import { extractCodes } from '../../../src/core/errors/extractCodes.js';

describe('extractCodes', () => {
  it('flattens field validation codes (400)', () => {
    const body = { errors: { name: ['blank', 'too_short'], slug: ['taken'] } };

    expect(extractCodes(body)).toEqual(['blank', 'too_short', 'taken']);
  });

  it('reads a DRF detail string (401 / 403 role / 404)', () => {
    expect(extractCodes({ detail: 'token_invalid' })).toEqual(['token_invalid']);
    expect(extractCodes({ detail: 'Not found.' })).toEqual(['Not found.']);
  });

  it('reads errors.detail codes (403 scope)', () => {
    expect(extractCodes({ errors: { detail: ['scope_missing'] } })).toEqual(['scope_missing']);
  });

  it('reads error and reason (422 upload)', () => {
    const body = { error: 'Unprocessable Entity', reason: 'invalid_type', size: 3 };

    expect(extractCodes(body)).toEqual(['Unprocessable Entity', 'invalid_type']);
  });

  it('reads error (422 link)', () => {
    expect(extractCodes({ status: 'failed', error: 'already_linked' })).toEqual(['already_linked']);
  });

  it('accepts detail and errors given as arrays or strings', () => {
    expect(extractCodes({ detail: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(extractCodes({ errors: ['x', 'y'] })).toEqual(['x', 'y']);
    expect(extractCodes({ errors: { base: 'z' } })).toEqual(['z']);
  });

  it('drops duplicates and non-string values', () => {
    const body = { errors: { a: ['dup', 3, null], b: ['dup'] }, detail: { nested: true } };

    expect(extractCodes(body)).toEqual(['dup']);
  });

  it('returns no code for empty, null, text or array bodies', () => {
    expect(extractCodes(null)).toEqual([]);
    expect(extractCodes(undefined)).toEqual([]);
    expect(extractCodes('')).toEqual([]);
    expect(extractCodes('<html><body>502 Bad Gateway</body></html>')).toEqual([]);
    expect(extractCodes([1, 2])).toEqual([]);
    expect(extractCodes({})).toEqual([]);
  });
});
