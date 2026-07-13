import GameController from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/AccessStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('merges can_edit from AccessStore onto the game object', async function() {
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ name: 'Demo', game_slug: 'demo' }));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
    expect(setGame).toHaveBeenCalledWith(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: true }),
    );

    cleanup();
  });

  it('sets can_edit to false when AccessStore resolves with the fail-closed default', async function() {
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ name: 'Demo', game_slug: 'demo' }));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setGame).toHaveBeenCalledWith(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
    );
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
