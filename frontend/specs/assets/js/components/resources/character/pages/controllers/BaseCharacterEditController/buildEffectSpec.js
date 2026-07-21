import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
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
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: true }, { can_edit: false });
      const fullCharacterClient = jasmine.createSpyObj('characterClient', [
        'fetchCharacter', 'fetchCharacterFull', 'fetchCharacterTreasures', 'fetchCharacterItems',
        'fetchCharacterDocuments', 'fetchCharacterPhotos', 'updateCharacter',
      ]);

      client.currentHash.and.returnValue('#/games/demo/npcs/1/edit');
      fullCharacterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 1, can_edit: false }),
      }));
      fullCharacterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([]),
      }));
      fullCharacterClient.fetchCharacterItems.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([]),
      }));
      fullCharacterClient.fetchCharacterDocuments.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([]),
      }));
      fullCharacterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({
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
        id: 1,
        treasures: [],
        items: [],
        documents: [],
        photos: [],
        game_type: 'dnd',
        can_edit: true,
        is_player: false,
        is_staff: false,
        private_description: 'Notes.',
        access_resolved: true,
      });

      cleanup();
    });
  });
});
