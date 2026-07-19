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
});
