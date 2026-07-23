import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, resource, getParamsFromHash }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    it(`uses route params to request ${kind.slice(0, -1)} character detail through RequestStore`, async function() {
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false, is_staff: false }));
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 2 } }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterPhotos']);
      characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController', resource, quantityType: 'single', params: { gameSlug: 'demo', id: '2' },
      });
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2,
        treasures: [],
        items: [],
        documents: [],
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
