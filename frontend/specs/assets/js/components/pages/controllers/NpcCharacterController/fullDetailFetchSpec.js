import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildEffectController } from './support.js';

describe('NpcCharacterController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('fetches full detail and merges private_description when can_edit is true', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull', 'fetchNpcAccess', 'fetchNpcTreasures']);
    characterClient.fetchNpcTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true, private_description: 'Secret lore.' }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcFull).toHaveBeenCalledWith('demo', '2', null);
    expect(setCharacter).toHaveBeenCalledWith({
      id: 2, treasures: [], can_edit: true, private_description: 'Secret lore.',
    });

    cleanup();
  });

  it('does not fetch full detail when can_edit is false', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull', 'fetchNpcAccess', 'fetchNpcTreasures']);
    characterClient.fetchNpcTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true }),
    }));
    characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpcFull).not.toHaveBeenCalled();
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false });

    cleanup();
  });

  it('falls back to character without private_description when full fetch fails', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull', 'fetchNpcAccess', 'fetchNpcTreasures']);
    characterClient.fetchNpcTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));
    characterClient.fetchNpcFull.and.returnValue(Promise.resolve({ ok: false, status: 403 }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: true });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
