import TreasuresController from '../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasuresController.js';
import AccessStore from '../../../../../../../../assets/js/utils/AccessStore.js';

describe('TreasuresController', function() {
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
  });

  it('fetches treasures and pagination when the user is a superuser', async function() {
    spyOn(AccessStore, 'ensureSuperUser').and.returnValue(Promise.resolve(true));
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const cleanup = new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client, setIsSuperUser,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/treasures.json');
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();
    expect(setIsSuperUser).toHaveBeenCalledWith(true);

    cleanup();
  });

  it('sets error when the fetch fails', async function() {
    spyOn(AccessStore, 'ensureSuperUser').and.returnValue(Promise.resolve(true));
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('redirects to home and does not fetch when the user is not a superuser', async function() {
    spyOn(AccessStore, 'ensureSuperUser').and.returnValue(Promise.resolve(false));
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
