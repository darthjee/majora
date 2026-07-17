import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    it('sets an error when the fetch fails', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2/treasures`);
      client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = new Controller(
        setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error without fetching when params are missing', async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue('#/other');

      const cleanup = new Controller(
        setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchIndex).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });
  });
});
