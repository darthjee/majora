import Router from '../../../../assets/js/utils/Router.js';

describe('Router', function() {
  it('resolves routes from registration order', function() {
    const router = new Router();
    router.register('/games/:game_slug/characters/:character_id', 'character');
    router.register('/games/:game_slug', 'game');

    expect(router.resolve('/games/demo/characters/2')).toBe('character');
    expect(router.resolve('/games/demo')).toBe('game');
  });

  it('returns home for unmatched routes', function() {
    const router = new Router();
    expect(router.resolve('/unknown')).toBe('home');
  });

  it('extracts params from hash routes', function() {
    expect(
      Router.extractParams('/games/:game_slug/characters/:character_id', '#/games/demo/characters/2?page=1'),
    ).toEqual({ game_slug: 'demo', character_id: '2' });
  });
});
