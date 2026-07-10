import GameSessionsController
  from '../../../../../../../assets/js/components/pages/controllers/GameSessionsController.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('GameSessionsController', function() {
  it('does not update state after unmount', async function() {
    const setSessions = jasmine.createSpy('setSessions');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/sessions');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: true }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
    ).buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setSessions).not.toHaveBeenCalled();
    expect(setPagination).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
    expect(setCanEdit).not.toHaveBeenCalled();
  });
});
