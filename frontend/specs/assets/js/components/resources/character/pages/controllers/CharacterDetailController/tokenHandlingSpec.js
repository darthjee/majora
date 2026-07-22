import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, getParamsFromHash }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    it('passes the token to the preview-list fetches when one exists', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false, is_staff: false }));
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 2 } }));

      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacterTreasures', 'fetchCharacterItems', 'fetchCharacterDocuments', 'fetchCharacterPhotos'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterItems.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterDocuments.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchCharacterTreasures).toHaveBeenCalledWith(kind, 'demo', '2', 'tok-abc');
      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith(kind, 'demo', '2');
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

      cleanup();
    });

    it('passes a null token to the preview-list fetches when no token exists', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue(null);
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false, is_staff: false }));
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 2 } }));

      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacterTreasures', 'fetchCharacterItems', 'fetchCharacterDocuments', 'fetchCharacterPhotos'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterItems.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterDocuments.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchCharacterTreasures).toHaveBeenCalledWith(kind, 'demo', '2', null);
      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith(kind, 'demo', '2');

      cleanup();
    });

    it('resolves access through AccessStore regardless of the stored token', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-xyz');
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false, is_staff: false }));
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 2 } }));

      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacterTreasures', 'fetchCharacterItems', 'fetchCharacterDocuments', 'fetchCharacterPhotos'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterItems.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterDocuments.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
      characterClient.fetchCharacterPhotos.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith(kind, 'demo', '2');

      cleanup();
    });
  });
});
