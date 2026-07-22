import GameController from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import { stubEnsureGameAccess, stubEnsureGamePermissions, stubEnsureGame } from './support.js';

describe('GameController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('uses route params to request game detail via RequestStore', async function() {
    stubEnsureGameAccess();
    stubEnsureGamePermissions();
    const ensureSpy = stubEnsureGame({ game_slug: 'demo' });
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
      return Promise.resolve([]);
    });

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureSpy).toHaveBeenCalledWith({
      resource: 'game', quantityType: 'single', params: { gameSlug: 'demo' },
    });
    expect(setGame).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets an error when RequestStore.ensure rejects', async function() {
    stubEnsureGameAccess();
    stubEnsureGamePermissions();
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('network error')));
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve([]));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load game.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('renders the game immediately with fail-closed access/permissions, then re-renders once AccessStore resolves', async function() {
    stubEnsureGameAccess({ is_owner: true }, {});
    stubEnsureGamePermissions({ can_edit: true }, { can_edit: false });
    stubEnsureGame({ game_slug: 'demo' });
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve([]));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client)
      .buildEffect()();

    expect(setGame).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame.calls.count()).toBe(2);
    expect(setGame.calls.argsFor(0)[0]).toEqual(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
    );
    expect(setGame.calls.argsFor(0)[0].is_owner).toBeUndefined();
    expect(setGame.calls.argsFor(1)[0]).toEqual(
      jasmine.objectContaining({ game_slug: 'demo', is_owner: true, can_edit: true }),
    );
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
