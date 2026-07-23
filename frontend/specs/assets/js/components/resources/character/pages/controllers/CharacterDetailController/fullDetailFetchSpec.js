import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, resource, privateDescription, getParamsFromHash }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    it('renders private_description straight through once RequestStore resolves the full (editor-only) variant', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: true }, { can_edit: false });
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: { id: 2, can_edit: true, private_description: privateDescription },
      }));
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
        can_edit: true,
        is_player: false,
        is_staff: false,
        private_description: privateDescription,
        access_resolved: true,
      });

      cleanup();
    });

    it('renders without private_description when RequestStore resolves the player-facing variant', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 2 } }));
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
  });
});
