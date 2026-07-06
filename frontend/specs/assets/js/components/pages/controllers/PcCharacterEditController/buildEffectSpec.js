import PcCharacterEditController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('requests the character detail using the edit route params', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess', 'fetchPcTreasures', 'updatePc'],
      );

      client.currentHash.and.returnValue('#/games/demo/pcs/2/edit');
      characterClient.fetchPc.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: false }),
      }));
      characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));
      characterClient.fetchPcTreasures.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }));
      characterClient.fetchPcFull.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: true, private_description: 'Secret.' }),
      }));

      const controller = new PcCharacterEditController(
        setCharacter,
        setLoading,
        setError,
        Noop.noop,
        client,
        characterClient,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchPc).toHaveBeenCalledWith('demo', '2', null);
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, treasures: [], can_edit: true, private_description: 'Secret.',
      });

      cleanup();
    });
  });
});
