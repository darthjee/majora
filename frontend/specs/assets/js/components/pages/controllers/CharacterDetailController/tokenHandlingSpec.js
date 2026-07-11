import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, getParamsFromHash }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    it('passes the token when one exists', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false }));

      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterTreasures'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);
      characterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: false }),
      }));

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchCharacter).toHaveBeenCalledWith(kind, 'demo', '2', 'tok-abc');
      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith(kind, 'demo', '2');
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false, is_player: false });

      cleanup();
    });

    it('passes a null token when no token exists', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue(null);
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false }));

      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterTreasures'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

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
      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith(kind, 'demo', '2');

      cleanup();
    });

    it('resolves access through AccessStore regardless of the stored token', async function() {
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-xyz');
      spyOn(AccessStore, 'ensureCharacterAccess')
        .and.returnValue(Promise.resolve({ can_edit: false, is_player: false }));

      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterTreasures'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);
      characterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: false }),
      }));

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith(kind, 'demo', '2');

      cleanup();
    });
  });
});
