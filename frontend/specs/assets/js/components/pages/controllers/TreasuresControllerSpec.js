import TreasuresController from '../../../../../../assets/js/components/pages/controllers/TreasuresController.js';

describe('TreasuresController', function() {
  let setTreasures;
  let setPagination;
  let setLoading;
  let setError;
  let client;
  let authClient;

  beforeEach(function() {
    setTreasures = jasmine.createSpy('setTreasures');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    client = jasmine.createSpyObj('client', ['fetchIndex']);
    authClient = jasmine.createSpyObj('authClient', ['status']);
  });

  it('fetches treasures and pagination when the user is a superuser', async function() {
    authClient.status.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ is_superuser: true }),
    }));
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const cleanup = await new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client, authClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/treasures.json');
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets error when the fetch fails', async function() {
    authClient.status.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ is_superuser: true }),
    }));
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = await new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client, authClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('redirects to home and does not fetch when the user is not a superuser', async function() {
    authClient.status.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ is_superuser: false }),
    }));
    const fakeWindow = { location: { hash: '' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = await new TreasuresController(
        setTreasures, setPagination, setLoading, setError, client, authClient,
      ).buildEffect()();

      expect(fakeWindow.location.hash).toBe('/');
      expect(client.fetchIndex).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });
});
