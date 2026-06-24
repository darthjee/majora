import NpcCharacterFullController, { getNpcCharacterFullParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterFullController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('NpcCharacterFullController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts character params from hash', function() {
    expect(getNpcCharacterFullParamsFromHash('#/games/demo/npcs/1/full')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });

  it('uses route params to request npc full character detail', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2/full');
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 2, private_description: 'Secret.' }),
    }));

    const cleanup = new NpcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcFull).toHaveBeenCalledWith('demo', '2', null);
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, private_description: 'Secret.' });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('passes the token when one exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2/full');
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 2 }),
    }));

    const cleanup = new NpcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcFull).toHaveBeenCalledWith('demo', '2', 'tok-abc');

    cleanup();
  });

  it('redirects to detail page on 403 response', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2/full');
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({ ok: false, status: 403 }));

    const originalHash = window.location.hash;

    const cleanup = new NpcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.location.hash).toBe('#/games/demo/npcs/2');
    expect(setCharacter).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();

    window.location.hash = originalHash;
    cleanup();
  });

  it('sets an error when the request fails (non-403)', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2/full');
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

    const cleanup = new NpcCharacterFullController(
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
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpcFull']);

    client.currentHash.and.returnValue('#/other');

    const cleanup = new NpcCharacterFullController(
      setCharacter,
      setLoading,
      setError,
      client,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load character.');
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(characterClient.fetchNpcFull).not.toHaveBeenCalled();

    cleanup();
  });
});
