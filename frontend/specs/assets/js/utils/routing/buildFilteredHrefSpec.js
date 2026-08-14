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

  it('serializes an array filter value as one repeated query entry per element', function() {
    expect(buildFilteredHref('#/miniatures/stl_models', { race: ['elf', 'orc'] }))
      .toBe('#/miniatures/stl_models?page=1&race=elf&race=orc');
  });

  it('mixes scalar and array filter values', function() {
    expect(buildFilteredHref('#/miniatures/stl_models', { name: 'gob', race: ['elf', 'orc'] }))
      .toBe('#/miniatures/stl_models?page=1&name=gob&race=elf&race=orc');
  });

  it('omits an array filter key entirely when the array is empty', function() {
    expect(buildFilteredHref('#/miniatures/stl_models', { race: [] })).toBe('#/miniatures/stl_models?page=1');
  });
});
