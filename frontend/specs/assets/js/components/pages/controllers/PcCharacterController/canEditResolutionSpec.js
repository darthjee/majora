import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildEffectController } from './support.js';

describe('PcCharacterController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('falls back to original can_edit when access endpoint returns non-ok', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures']);
    characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchCharacter.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchCharacterAccess.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false });
    expect(characterClient.fetchCharacterFull).not.toHaveBeenCalled();

    cleanup();
  });

  it('falls back to original can_edit when access endpoint throws', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'fetchCharacterFull', 'fetchCharacterAccess', 'fetchCharacterTreasures']);
    characterClient.fetchCharacterTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchCharacter.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchCharacterAccess.and.returnValue(Promise.reject(new Error('Network error')));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
