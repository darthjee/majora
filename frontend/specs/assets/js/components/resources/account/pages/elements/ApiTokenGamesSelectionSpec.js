import { MAX_GAMES, applyGamesSelection } from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenGamesSelection.js';

describe('ApiTokenGamesSelection', function() {
  const buildGames = (count) => Array.from({ length: count }, (_, index) => ({ slug: `g${index}`, name: `G${index}` }));
  const toPicked = (games) => games.map(({ slug, name }) => ({ id: slug, name }));

  it('caps at 100 games, like the backend', function() {
    expect(MAX_GAMES).toBe(100);
  });

  it('maps the picker selection to slugs', function() {
    expect(applyGamesSelection([], [{ id: 'a', name: 'A' }])).toEqual([{ slug: 'a', name: 'A' }]);
  });

  it('does not add a 101st game', function() {
    const value = buildGames(100);
    const picked = toPicked(buildGames(101));

    expect(applyGamesSelection(value, picked)).toBe(value);
  });

  it('allows removals at the cap', function() {
    const value = buildGames(100);
    const picked = toPicked(value.slice(1));

    expect(applyGamesSelection(value, picked).length).toBe(99);
  });
});
