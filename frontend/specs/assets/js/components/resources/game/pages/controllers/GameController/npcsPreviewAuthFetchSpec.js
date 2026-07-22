import GameController from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import { stubEnsureGameAccess, stubEnsureGamePermissions, stubEnsureGame } from './support.js';

describe('GameController', function() {
  beforeEach(function() {
    stubEnsureGameAccess();
    stubEnsureGamePermissions();
    stubEnsureGame();
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('NPCs preview auth fetch', function() {
    const publicNpcs = [{ id: 2, name: 'Gandalf' }];
    let setNpcs;
    let client;
    let characterClient;

    beforeEach(function() {
      setNpcs = jasmine.createSpy('setNpcs');
      client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
      characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcsAll']);
      client.currentHash.and.returnValue('#/games/demo');
      client.fetch.and.callFake((path) => {
        if (path.startsWith('/games/demo/npcs.json')) {
          return Promise.resolve(publicNpcs);
        }
        return Promise.resolve([]);
      });
    });

    function makeController() {
      return new GameController(
        jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(),
        Noop.noop, setNpcs, client, characterClient,
      );
    }

    it('skips the auth fetch when no token is stored', async function() {
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(characterClient.fetchNpcsAll).not.toHaveBeenCalled();
      expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
      cleanup();
    });

    it('uses the authenticated NPC list when the auth fetch succeeds', async function() {
      const authNpcs = [{ id: 99, name: 'Hidden NPC' }];
      characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(authNpcs),
      }));
      AuthStorage.setToken('mytoken');
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(setNpcs).toHaveBeenCalledWith(authNpcs);
      cleanup();
    });

    it('falls back to public when the auth fetch returns a non-ok response', async function() {
      characterClient.fetchNpcsAll.and.returnValue(Promise.resolve({ ok: false }));
      AuthStorage.setToken('mytoken');
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
      cleanup();
    });

    it('falls back to public when the auth fetch rejects', async function() {
      characterClient.fetchNpcsAll.and.returnValue(Promise.reject(new Error('network error')));
      AuthStorage.setToken('mytoken');
      const cleanup = makeController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(setNpcs).toHaveBeenCalledWith(publicNpcs);
      cleanup();
    });
  });
});
