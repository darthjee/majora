import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    describe('#buildEffect', function() {
      it('requests the character detail using the edit route params', async function() {
        stubAccessPair(
          'ensureCharacterAccess', 'getCharacterAccess',
          { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
        );
        stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: true }, { can_edit: false });
        const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: { id: 2, can_edit: true, private_description: 'Secret.' },
        }));
        const setCharacter = jasmine.createSpy('setCharacter');
        const setLoading = jasmine.createSpy('setLoading');
        const setError = jasmine.createSpy('setError');
        const client = jasmine.createSpyObj('client', ['currentHash']);
        const characterClient = jasmine.createSpyObj(
          'characterClient',
          [
            'fetchCharacterTreasures', 'fetchCharacterItems',
            'fetchCharacterDocuments', 'fetchCharacterPhotos', 'updateCharacter',
          ],
        );

        client.currentHash.and.returnValue(`#/games/demo/${kind}/2/edit`);
        characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }));
        characterClient.fetchCharacterItems.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }));
        characterClient.fetchCharacterDocuments.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }));
        characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }));

        const controller = new Controller(
          setCharacter,
          setLoading,
          setError,
          Noop.noop,
          client,
          characterClient,
        );
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(ensureSpy).toHaveBeenCalledWith({
          componentName: 'CharacterController',
          resource: kind === 'npcs' ? 'npc' : 'pc',
          quantityType: 'single',
          params: { gameSlug: 'demo', id: '2' },
        });
        expect(setCharacter).toHaveBeenCalledWith({
          id: 2,
          treasures: [],
          items: [],
          documents: [],
          photos: [],
          game_type: 'dnd',
          can_edit: true,
          is_player: false,
          is_staff: false,
          private_description: 'Secret.',
          access_resolved: true,
        });

        cleanup();
      });
    });
  });
});
