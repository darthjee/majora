import GameController, { getGameSlugFromHash }
  from '../../../../../../assets/js/components/pages/controllers/GameController.js';

describe('GameController', function() {
  it('extracts game slug from hash', function() {
    expect(getGameSlugFromHash('#/games/demo')).toBe('demo');
  });

  it('uses route params to request game detail', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ game_slug: 'demo' }));

    const cleanup = new GameController(setGame, setLoading, setError, client).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo.json');
    expect(setGame).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
