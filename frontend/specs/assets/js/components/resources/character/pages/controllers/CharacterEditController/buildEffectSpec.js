import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    describe('#buildEffect', function() {
      it('requests the character detail using the edit route params', async function() {
        stubAccessPair('ensureCharacterAccess', 'getCharacterAccess', { is_player: false }, { is_player: false });
        stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: true }, { can_edit: false });
        const setCharacter = jasmine.createSpy('setCharacter');
        const setLoading = jasmine.createSpy('setLoading');
        const setError = jasmine.createSpy('setError');
        const client = jasmine.createSpyObj('client', ['currentHash']);
        const characterClient = jasmine.createSpyObj(
          'characterClient',
          ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterTreasures', 'fetchCharacterPhotos', 'updateCharacter'],
        );

        client.currentHash.and.returnValue(`#/games/demo/${kind}/2/edit`);
        characterClient.fetchCharacter.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2, can_edit: false }),
        }));
        characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }));
        characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }));
        characterClient.fetchCharacterFull.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2, can_edit: true, private_description: 'Secret.' }),
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

        expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '2', null);
        expect(setCharacter).toHaveBeenCalledWith({
          id: 2,
          treasures: [],
          photos: [],
          can_edit: true,
          is_player: false,
          private_description: 'Secret.',
          access_resolved: true,
        });

        cleanup();
      });
    });
  });
});
