import NpcCharacterController, { getNpcCharacterParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('NpcCharacterController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts character params from hash', function() {
    expect(getNpcCharacterParamsFromHash('#/games/demo/npcs/1')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });

  it('uses route params to request npc character detail', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpc).toHaveBeenCalledWith('demo', '2', null);
    expect(characterClient.fetchNpcFull).not.toHaveBeenCalled();
    expect(setCharacter).toHaveBeenCalledWith({ id: 2 });
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
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpc).toHaveBeenCalledWith('demo', '2', 'tok-abc');
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });

    cleanup();
  });

  it('passes a null token when no token exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue(null);

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpc).toHaveBeenCalledWith('demo', '2', null);

    cleanup();
  });

  it('fetches full detail and merges private_description when can_edit is true', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true }),
    }));
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true, private_description: 'Secret lore.' }),
    }));

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcFull).toHaveBeenCalledWith('demo', '2', null);
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true, private_description: 'Secret lore.' });

    cleanup();
  });

  it('does not fetch full detail when can_edit is false', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcFull).not.toHaveBeenCalled();
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });

    cleanup();
  });

  it('falls back to character without private_description when full fetch fails', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true }),
    }));
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({ ok: false, status: 403 }));

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets an error when the request fails', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
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
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull']);

    client.currentHash.and.returnValue('#/other');

    const cleanup = new NpcCharacterController(
      setCharacter,
      setLoading,
      setError,
      client,
      getNpcCharacterParamsFromHash,
      characterClient,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load character.');
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(characterClient.fetchNpc).not.toHaveBeenCalled();

    cleanup();
  });
});
