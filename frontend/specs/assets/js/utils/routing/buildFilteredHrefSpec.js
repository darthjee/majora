import buildFilteredHref from '../../../../../assets/js/utils/routing/buildFilteredHref.js';

describe('buildFilteredHref', function() {
  it('resets pagination to page 1 with no filters', function() {
    expect(buildFilteredHref('#/treasures', {})).toBe('#/treasures?page=1');
  });

  it('appends every filter after resetting to page 1', function() {
    expect(buildFilteredHref('#/games/demo/npcs', { slain: 'true', name: 'gob' }))
      .toBe('#/games/demo/npcs?page=1&slain=true&name=gob');
  });

  it('serializes a blank filter value as an empty query param', function() {
    expect(buildFilteredHref('#/treasures', { name: '' })).toBe('#/treasures?page=1&name=');
  });
});
