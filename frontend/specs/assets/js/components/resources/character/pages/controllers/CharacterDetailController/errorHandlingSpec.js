import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, resource, getParamsFromHash }) => {
  describe(label, function() {
    afterEach(function() {
      AuthStorage.clearToken();
    });

    it('sets an error when RequestStore.ensure rejects', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('network error')));
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterTreasures']);

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2`);

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController', resource, quantityType: 'single', params: { gameSlug: 'demo', id: '2' },
      });
      expect(setError).toHaveBeenCalledWith('Unable to load character.');
      expect(setCharacter).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when params are missing', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: {} }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash']);
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacterTreasures']);

      client.currentHash.and.returnValue('#/other');

      const cleanup = new Controller(
        setCharacter, setLoading, setError, client, getParamsFromHash, characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load character.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
