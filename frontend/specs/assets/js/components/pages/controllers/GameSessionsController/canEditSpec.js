import GameSessionsController
  from '../../../../../../../assets/js/components/pages/controllers/GameSessionsController.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

describe('GameSessionsController', function() {
  it('sets canEdit to true when the game access response allows editing', async function() {
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
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('sets canEdit to false when the access resolves with the fail-closed default', async function() {
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
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets canEdit to false when the access request throws', async function() {
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
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new GameSessionsController(
      setSessions,
      setPagination,
      setLoading,
      setError,
      client,
      setCanEdit,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCanEdit).toHaveBeenCalledWith(false);

    cleanup();
  });
});
