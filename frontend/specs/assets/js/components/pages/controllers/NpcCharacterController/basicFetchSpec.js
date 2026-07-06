import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';
import { buildEffectController } from './support.js';

describe('NpcCharacterController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('uses route params to request npc character detail', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'fetchNpcFull', 'fetchNpcAccess', 'fetchNpcTreasures']);
    characterClient.fetchNpcTreasures.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

    client.currentHash.and.returnValue('#/games/demo/npcs/2');
    characterClient.fetchNpc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));
    characterClient.fetchNpcAccess.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchNpc).toHaveBeenCalledWith('demo', '2', null);
    expect(characterClient.fetchNpcFull).not.toHaveBeenCalled();
    expect(characterClient.fetchNpcTreasures).toHaveBeenCalledWith('demo', '2', null);
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [] });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
