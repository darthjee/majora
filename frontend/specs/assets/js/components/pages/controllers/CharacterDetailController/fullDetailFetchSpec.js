import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, privateDescription, getParamsFromHash }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    it('fetches full detail and merges private_description when can_edit is true', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);
      characterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: false }),
      }));
      characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));
      characterClient.fetchCharacterFull.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: true, private_description: privateDescription }),
      }));

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchCharacterFull).toHaveBeenCalledWith(kind, 'demo', '2', null);
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, treasures: [], can_edit: true, private_description: privateDescription,
      });

      cleanup();
    });

    it('does not fetch full detail when can_edit is false', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);
      characterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: true }),
      }));
      characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: false }),
      }));

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(characterClient.fetchCharacterFull).not.toHaveBeenCalled();
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false });

      cleanup();
    });

    it('falls back to character without private_description when full fetch fails', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj(
        'characterClient',
        ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures'],
      );
      characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);
      characterClient.fetchCharacter.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, can_edit: false }),
      }));
      characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));
      characterClient.fetchCharacterFull.and.returnValue(Promise.resolve({ ok: false, status: 403 }));

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: true });
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
