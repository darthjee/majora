import PcCharacterFullController, { getPcCharacterFullParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterFullController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterFullController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts character params from hash', function() {
    expect(getPcCharacterFullParamsFromHash('#/games/demo/pcs/1/full')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });

  it('uses route params to request pc full character detail', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPcFull']);

    client.currentHash.and.returnValue('#/games/demo/pcs/3/full');
    characterClient.fetchPcFull.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 3, private_description: 'Secret.' }),
    }));

    const cleanup = new PcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPcFull).toHaveBeenCalledWith('demo', '3', null);
    expect(setCharacter).toHaveBeenCalledWith({ id: 3, private_description: 'Secret.' });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('passes the token when one exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-xyz');

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPcFull']);

    client.currentHash.and.returnValue('#/games/demo/pcs/3/full');
    characterClient.fetchPcFull.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 3 }),
    }));

    const cleanup = new PcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPcFull).toHaveBeenCalledWith('demo', '3', 'tok-xyz');

    cleanup();
  });

  it('redirects to detail page on 403 response', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPcFull']);

    client.currentHash.and.returnValue('#/games/demo/pcs/3/full');
    characterClient.fetchPcFull.and.returnValue(Promise.resolve({ ok: false, status: 403 }));

    const fakeWindow = { location: { hash: '' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new PcCharacterFullController(
        setCharacter,
        setLoading,
        setError,
        client,
        characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/games/demo/pcs/3');
      expect(setCharacter).not.toHaveBeenCalled();
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets an error when the request fails (non-403)', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPcFull']);

    client.currentHash.and.returnValue('#/games/demo/pcs/3/full');
    characterClient.fetchPcFull.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

    const cleanup = new PcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load character.');
    expect(setCharacter).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets an error when params are missing', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPcFull']);

    client.currentHash.and.returnValue('#/other');

    const cleanup = new PcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load character.');
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(characterClient.fetchPcFull).not.toHaveBeenCalled();

    cleanup();
  });
});
