import GameTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/GameTreasuresController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('GameTreasuresController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('uses route params to request game treasures', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/treasures');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameTreasuresController(
      setTreasures,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/treasures.json');
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
