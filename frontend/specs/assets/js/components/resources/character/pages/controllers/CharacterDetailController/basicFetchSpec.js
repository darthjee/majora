import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, getParamsFromHash }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    it(`uses route params to request ${kind.slice(0, -1)} character detail`, async function() {
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false, is_staff: false }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterTreasures', 'fetchCharacterPhotos'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);
      characterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2 }),
      }));

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '2', null);
      expect(characterClient.fetchCharacterFull).not.toHaveBeenCalled();
      expect(characterClient.fetchCharacterTreasures).toHaveBeenCalledWith(kind, 'demo', '2', null);
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2,
        treasures: [],
        photos: [],
        game_type: 'dnd',
        can_edit: false,
        is_player: false,
        is_staff: false,
        access_resolved: true,
      });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
