import TreasuresController from '../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasuresController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('TreasuresController', function() {
  describe('.buildFilterQueryHash', function() {
    it('resets pagination to page 1 when no filters are active', function() {
      expect(TreasuresController.buildFilterQueryHash('#/treasures', {}))
        .toBe('#/treasures?page=1');
    });

    it('includes the active game_type/min_value/max_value/name filters alongside the reset page', function() {
      expect(
        TreasuresController.buildFilterQueryHash('#/treasures', {
          game_type: 'dnd', min_value: '10', max_value: '100', name: 'sword',
        })
      ).toBe('#/treasures?page=1&game_type=dnd&min_value=10&max_value=100&name=sword');
    });

    it('includes only the given filter when a single one is active', function() {
      expect(TreasuresController.buildFilterQueryHash('#/treasures', { name: 'sword' }))
        .toBe('#/treasures?page=1&name=sword');
    });
  });

  let setTreasures;
  let setPagination;
  let setLoading;
  let setError;
  let setIsSuperUser;
  let client;

  beforeEach(function() {
    setTreasures = jasmine.createSpy('setTreasures');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setIsSuperUser = jasmine.createSpy('setIsSuperUser');
    client = jasmine.createSpyObj('client', ['fetchIndex']);
    client.currentHash = () => '';
  });

  it('fetches treasures and pagination when the user is staff or a superuser', async function() {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const cleanup = new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client, setIsSuperUser,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/treasures.json', {});
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();
    expect(setIsSuperUser).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('fetches treasures with the filter params from the hash', async function() {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));
    client.currentHash = () => '#/treasures?game_type=dnd&min_value=10&max_value=100&name=sword';

    const cleanup = new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client, setIsSuperUser,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/treasures.json', {
      name: 'sword', game_type: 'dnd', min_value: '10', max_value: '100',
    });

    cleanup();
  });

  it('sets error when the fetch fails', async function() {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('redirects to home and does not fetch when the user is neither staff nor superuser', async function() {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(false));
    const fakeWindow = { location: { hash: '' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new TreasuresController(
        setTreasures, setPagination, setLoading, setError, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(client.fetchIndex).not.toHaveBeenCalled();
      expect(setIsSuperUser).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });
});
