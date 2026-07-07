import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
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
          'characterClient',
          ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures', 'updateCharacter'],
        );

        client.currentHash.and.returnValue(`#/games/demo/${kind}/2/edit`);
        characterClient.fetchCharacter.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2, can_edit: false }),
        }));
        characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ can_edit: true }),
        }));
        characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({
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
          id: 2, treasures: [], can_edit: true, private_description: 'Secret.',
        });

        cleanup();
      });
    });
  });
});
