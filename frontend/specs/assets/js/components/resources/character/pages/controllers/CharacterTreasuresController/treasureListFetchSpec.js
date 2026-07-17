import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { KINDS, buildCharacterClient } from './support.js';

KINDS.forEach(({ label, Controller, kind }) => {
  describe(label, function() {
    it(`uses route params to request ${kind === 'pcs' ? 'pc' : 'npc'} character treasures`, async function() {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue(`#/games/demo/${kind}/2/treasures`);
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Sword', quantity: 1, value: 100 }],
        pagination: { page: 2, pages: 3, perPage: 4 },
      }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = new Controller(
        setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchIndex).toHaveBeenCalledWith(`/games/demo/${kind}/2/treasures.json`);
      expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', quantity: 1, value: 100 }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });
  });
});
