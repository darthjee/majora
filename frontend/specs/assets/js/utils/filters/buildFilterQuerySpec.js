import buildFilterQuery from '../../../../../assets/js/utils/filters/buildFilterQuery.js';

describe('buildFilterQuery', function() {
  it('returns an empty object when every value is blank', function() {
    expect(buildFilterQuery([['status', ''], ['name', '']])).toEqual({});
  });

  it('includes only non-blank fields, keyed by field name', function() {
    expect(buildFilterQuery([['status', 'open'], ['name', ''], ['allegiance', 'ally']]))
      .toEqual({ status: 'open', allegiance: 'ally' });
  });

  it('preserves field entry order in the resulting object', function() {
    expect(Object.keys(buildFilterQuery([['b', '2'], ['a', '1']]))).toEqual(['b', 'a']);
  });

  it('returns an empty object for an empty entry list', function() {
    expect(buildFilterQuery([])).toEqual({});
  });

  it('keeps a non-empty array value as-is', function() {
    expect(buildFilterQuery([['race', ['elf', 'orc']]])).toEqual({ race: ['elf', 'orc'] });
  });

  it('omits an empty array value', function() {
    expect(buildFilterQuery([['race', []], ['name', 'gob']])).toEqual({ name: 'gob' });
  });

  it('mixes scalar and array entries', function() {
    expect(buildFilterQuery([['name', 'gob'], ['race', ['elf', 'orc']], ['type', '']]))
      .toEqual({ name: 'gob', race: ['elf', 'orc'] });
  });
});
