import sortDomains, { ASCENDING, DESCENDING }
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/domainsSort.js';

describe('sortDomains', function() {
  const row = (id, label, visits, averageDuration, unknown = false) => ({
    id, label, domain: unknown ? null : label, visits, average_duration_seconds: averageDuration, unknown,
  });
  const alpha = row(1, 'alpha.com', 5, 30);
  const beta = row(2, 'beta.com', 10, null);
  const gamma = row(3, 'gamma.com', 1, 300);
  const unknown = row('unknown', 'Unknown', 20, 10, true);
  const rows = [beta, alpha, gamma, unknown];
  const ids = (sorted) => sorted.map(({ id }) => id);

  it('exports the directions', function() {
    expect(ASCENDING).toBe('asc');
    expect(DESCENDING).toBe('desc');
  });

  it('sorts an empty list', function() {
    expect(sortDomains([], { key: 'visits', direction: ASCENDING })).toEqual([]);
  });

  it('sorts a single row', function() {
    expect(sortDomains([alpha], { key: 'visits', direction: DESCENDING })).toEqual([alpha]);
  });

  it('keeps the API order without a key', function() {
    expect(ids(sortDomains(rows))).toEqual([2, 1, 3, 'unknown']);
    expect(ids(sortDomains(rows, {}))).toEqual([2, 1, 3, 'unknown']);
  });

  it('returns a new array without mutating the rows', function() {
    const copy = [...rows];
    const sorted = sortDomains(rows, { key: 'visits' });

    expect(sorted).not.toBe(rows);
    expect(sortDomains(rows)).not.toBe(rows);
    expect(rows).toEqual(copy);
  });

  it('sorts numbers ascending by default', function() {
    expect(ids(sortDomains(rows, { key: 'visits' }))).toEqual([3, 1, 2, 'unknown']);
  });

  it('sorts numbers descending, keeping unknown last', function() {
    expect(ids(sortDomains(rows, { key: 'visits', direction: DESCENDING }))).toEqual([2, 1, 3, 'unknown']);
  });

  it('sorts strings with localeCompare in both directions', function() {
    expect(ids(sortDomains(rows, { key: 'label', direction: ASCENDING }))).toEqual([1, 2, 3, 'unknown']);
    expect(ids(sortDomains(rows, { key: 'label', direction: DESCENDING }))).toEqual([3, 2, 1, 'unknown']);
  });

  it('sorts null durations after numbers in both directions', function() {
    expect(ids(sortDomains(rows, { key: 'average_duration_seconds', direction: ASCENDING })))
      .toEqual([1, 3, 2, 'unknown']);
    expect(ids(sortDomains(rows, { key: 'average_duration_seconds', direction: DESCENDING })))
      .toEqual([3, 1, 2, 'unknown']);
  });

  it('pins the unknown row last even with the lowest value', function() {
    const lowUnknown = row('unknown', 'Unknown', 0, null, true);
    const list = [lowUnknown, alpha, beta];

    expect(ids(sortDomains(list, { key: 'visits', direction: ASCENDING }))).toEqual([1, 2, 'unknown']);
    expect(ids(sortDomains(list, { key: 'visits', direction: DESCENDING }))).toEqual([2, 1, 'unknown']);
  });

  it('sorts null strings (e.g. a missing group) last', function() {
    const withGroups = [
      { id: 1, group: null, unknown: false },
      { id: 2, group: 'Brand', unknown: false },
      { id: 3, group: 'Alpha', unknown: false },
    ];

    expect(ids(sortDomains(withGroups, { key: 'group', direction: DESCENDING }))).toEqual([2, 3, 1]);
  });

  it('keeps the API order for ties', function() {
    const tieA = row(10, 'a.com', 3, 1);
    const tieB = row(11, 'b.com', 3, 1);

    expect(ids(sortDomains([tieB, tieA], { key: 'visits', direction: DESCENDING }))).toEqual([11, 10]);
  });
});
