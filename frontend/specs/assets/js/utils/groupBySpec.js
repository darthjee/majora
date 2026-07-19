import groupBy from '../../../../assets/js/utils/groupBy.js';

describe('groupBy', function() {
  it('returns an empty Map for an empty list', function() {
    expect(groupBy([], (item) => item).size).toBe(0);
  });

  it('groups items sharing the same key together, preserving order', function() {
    const items = [
      { option: 1, user_id: 10 },
      { option: 2, user_id: 20 },
      { option: 1, user_id: 30 },
    ];

    const groups = groupBy(items, (item) => item.option);

    expect(groups.get(1)).toEqual([{ option: 1, user_id: 10 }, { option: 1, user_id: 30 }]);
    expect(groups.get(2)).toEqual([{ option: 2, user_id: 20 }]);
  });

  it('does not create an entry for a key with no items', function() {
    const groups = groupBy([{ option: 1 }], (item) => item.option);

    expect(groups.has(2)).toBe(false);
  });
});
