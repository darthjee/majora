import PcCharacterController, { getPcCharacterParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts character params from hash', function() {
    expect(getPcCharacterParamsFromHash('#/games/demo/pcs/1')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });

  it('uses route params to request pc character detail', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'request']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    client.request.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));

    const cleanup = new PcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.request).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
      headers: { Accept: 'application/json' },
    });
    expect(setCharacter).toHaveBeenCalledWith({ id: 2 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('attaches the Authorization header when a token exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'request']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    client.request.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true }),
    }));

    const cleanup = new PcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.request).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
      headers: { Accept: 'application/json', Authorization: 'Token tok-abc' },
    });
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true });

    cleanup();
  });

  it('omits the Authorization header when no token exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue(null);

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'request']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    client.request.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));

    const cleanup = new PcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.request).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
      headers: { Accept: 'application/json' },
    });

    cleanup();
  });

  it('sets an error when the request fails', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'request']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    client.request.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = new PcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
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
    const client = jasmine.createSpyObj('client', ['currentHash', 'request']);

    client.currentHash.and.returnValue('#/other');

    const cleanup = new PcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load character.');
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(client.request).not.toHaveBeenCalled();

    cleanup();
  });
});
