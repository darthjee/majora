import GameController from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';
import { stubEnsureGameAccess, stubEnsureGamePermissions } from './support.js';

describe('GameController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('renders can_edit false first, then merges the real can_edit once AccessStore resolves', async function() {
    stubEnsureGameAccess();
    const ensureGamePermissions = stubEnsureGamePermissions({ can_edit: true }, { can_edit: false });
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ name: 'Demo', game_slug: 'demo' }));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureGamePermissions).toHaveBeenCalled();
    expect(setGame.calls.count()).toBe(2);
    expect(setGame.calls.argsFor(0)[0]).toEqual(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: false }),
    );
    expect(setGame.calls.argsFor(1)[0]).toEqual(
      jasmine.objectContaining({ game_slug: 'demo', can_edit: true }),
    );

    cleanup();
  });

  it('sets can_edit to false when AccessStore resolves with the fail-closed default', async function() {
    stubEnsureGameAccess();
    stubEnsureGamePermissions({ can_edit: false }, { can_edit: false });
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);

    client.currentHash.and.returnValue('#/games/demo');
    client.fetch.and.returnValue(Promise.resolve({ name: 'Demo', game_slug: 'demo' }));

    const cleanup = new GameController(setGame, setLoading, setError, Noop.noop, Noop.noop, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    setGame.calls.allArgs().forEach(([game]) => {
      expect(game).toEqual(jasmine.objectContaining({ game_slug: 'demo', can_edit: false }));
    });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
