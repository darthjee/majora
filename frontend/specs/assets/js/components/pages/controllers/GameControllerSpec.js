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
    const setPcs = jasmine.createSpy('setPcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/pcs.json')) {
        return Promise.resolve([{ id: 1, name: 'Aragorn' }]);
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, client).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo.json');
    expect(setGame).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('fetches the PCs preview list alongside the game', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    const pcs = [{ id: 1, name: 'Aragorn' }];

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/pcs.json')) {
        return Promise.resolve(pcs);
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, client).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo/pcs.json?per_page=6');
    expect(setPcs).toHaveBeenCalledWith(pcs);

    cleanup();
  });

  it('sets an empty PCs list and still renders the game when the PCs fetch fails', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/pcs.json')) {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, client).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setPcs).toHaveBeenCalledWith([]);
    expect(setGame).toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
