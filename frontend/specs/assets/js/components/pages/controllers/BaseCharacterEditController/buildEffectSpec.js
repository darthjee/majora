import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
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
      const fullCharacterClient = jasmine.createSpyObj('characterClient', [
        'fetchNpc', 'fetchNpcFull', 'fetchNpcAccess', 'fetchNpcTreasures', 'updateNpc',
      ]);

      client.currentHash.and.returnValue('#/games/demo/npcs/1/edit');
      fullCharacterClient.fetchNpc.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 1, can_edit: false }),
      }));
      fullCharacterClient.fetchNpcAccess.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ can_edit: true }),
      }));
      fullCharacterClient.fetchNpcTreasures.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve([]),
      }));
      fullCharacterClient.fetchNpcFull.and.returnValue(Promise.resolve({
        ok: true, json: () => Promise.resolve({ id: 1, can_edit: true, private_description: 'Notes.' }),
      }));

      const controller = new TestCharacterEditController(
        setCharacter, setLoading, setError, Noop.noop, client, fullCharacterClient,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fullCharacterClient.fetchNpc).toHaveBeenCalledWith('demo', '1', null);
      expect(setCharacter).toHaveBeenCalledWith({
        id: 1, treasures: [], can_edit: true, private_description: 'Notes.',
      });

      cleanup();
    });
  });
});
