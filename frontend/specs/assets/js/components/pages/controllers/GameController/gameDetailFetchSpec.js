import GameController from '../../../../../../../assets/js/components/pages/controllers/GameController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { stubEnsureGameAccess } from './support.js';

describe('GameController', function() {
  beforeEach(function() {
    stubEnsureGameAccess();
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('uses route params to request game detail', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.callFake((path) => {
      if (path.startsWith('/games/demo/pcs.json')) {
        return Promise.resolve([{ id: 1, name: 'Aragorn' }]);
      }
      if (path.startsWith('/games/demo/npcs.json')) {
        return Promise.resolve([{ id: 2, name: 'Gandalf' }]);
      }
      return Promise.resolve({ game_slug: 'demo' });
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetch).toHaveBeenCalledWith('/games/demo.json');
    expect(setGame).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
