import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/AccessStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import { TestCharacterEditController, buildContext } from './support.js';

describe('BaseCharacterEditController', function() {
  let setCharacter;
  let setLoading;
  let setError;
  let client;

  afterEach(function() {
    AuthStorage.clearToken();
  });

  beforeEach(function() {
    ({ setCharacter, setLoading, setError, client } = buildContext());
  });

  describe('#buildEffect', function() {
    it('delegates to the load controller buildEffect', async function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ is_player: false }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      const fullCharacterClient = jasmine.createSpyObj('characterClient', [
        'fetchCharacter', 'fetchCharacterFull', 'fetchCharacterTreasures', 'updateCharacter',
      ]);

      client.currentHash.and.returnValue('#/games/demo/npcs/1/edit');
      fullCharacterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 1, can_edit: false }),
      }));
      fullCharacterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([]),
      }));
      fullCharacterClient.fetchCharacterFull.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 1, can_edit: true, private_description: 'Notes.' }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, Noop.noop, client, fullCharacterClient,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fullCharacterClient.fetchCharacter).toHaveBeenCalledWith('npcs', 'demo', '1', null);
      expect(setCharacter).toHaveBeenCalledWith({
        id: 1, treasures: [], can_edit: true, is_player: false, private_description: 'Notes.',
      });

      cleanup();
    });
  });
});
