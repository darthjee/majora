import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildEffectController } from './support.js';

describe('NpcCharacterController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('passes the token when one exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures']);
    characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchCharacter.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchCharacter).toHaveBeenCalledWith('npcs', 'demo', '2', 'tok-abc');
    expect(characterClient.fetchCharacterAccess).toHaveBeenCalledWith('npcs', 'demo', '2', 'tok-abc');
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false });

    cleanup();
  });

  it('passes a null token when no token exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue(null);

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures']);
    characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchCharacter.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));
    characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchCharacter).toHaveBeenCalledWith('npcs', 'demo', '2', null);
    expect(characterClient.fetchCharacterAccess).toHaveBeenCalledWith('npcs', 'demo', '2', null);

    cleanup();
  });

  it('always calls the access endpoint with the current token', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-xyz');

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures']);
    characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchCharacter.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchCharacterAccess).toHaveBeenCalledWith('npcs', 'demo', '2', 'tok-xyz');

    cleanup();
  });
});
