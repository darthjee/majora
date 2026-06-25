import PcCharacterController, { getPcCharacterParamsFromHash }
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  const buildEffectController = (setCharacter, setLoading, setError, client, characterClient) => (
    new PcCharacterController(
      setCharacter, setLoading, setError, client, getPcCharacterParamsFromHash, characterClient,
    )
  );

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
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPc).toHaveBeenCalledWith('demo', '2', null);
    expect(characterClient.fetchPcFull).not.toHaveBeenCalled();
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
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPc).toHaveBeenCalledWith('demo', '2', 'tok-abc');
    expect(characterClient.fetchPcAccess).toHaveBeenCalledWith('demo', '2', 'tok-abc');
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });

    cleanup();
  });

  it('passes a null token when no token exists', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue(null);

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPc).toHaveBeenCalledWith('demo', '2', null);
    expect(characterClient.fetchPcAccess).toHaveBeenCalledWith('demo', '2', null);

    cleanup();
  });

  it('fetches full detail and merges private_description when can_edit is true', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));
    characterClient.fetchPcFull.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true, private_description: 'Secret notes.' }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPcFull).toHaveBeenCalledWith('demo', '2', null);
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true, private_description: 'Secret notes.' });

    cleanup();
  });

  it('does not fetch full detail when can_edit is false', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: true }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPcFull).not.toHaveBeenCalled();
    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });

    cleanup();
  });

  it('falls back to character without private_description when full fetch fails', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: true }),
    }));
    characterClient.fetchPcFull.and.returnValue(Promise.resolve({ ok: false, status: 403 }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
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
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({ ok: false }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
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
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/other');

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load character.');
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(characterClient.fetchPc).not.toHaveBeenCalled();

    cleanup();
  });

  it('falls back to original can_edit when access endpoint returns non-ok', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
    expect(characterClient.fetchPcFull).not.toHaveBeenCalled();

    cleanup();
  });

  it('falls back to original can_edit when access endpoint throws', async function() {
    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.reject(new Error('Network error')));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('always calls the access endpoint with the current token', async function() {
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-xyz');

    const setCharacter = jasmine.createSpy('setCharacter');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'fetchPcFull', 'fetchPcAccess']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2');
    characterClient.fetchPc.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 2, can_edit: false }),
    }));
    characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ can_edit: false }),
    }));

    const cleanup = buildEffectController(setCharacter, setLoading, setError, client, characterClient)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(characterClient.fetchPcAccess).toHaveBeenCalledWith('demo', '2', 'tok-xyz');

    cleanup();
  });

  const safeSet = (setter, value) => setter(value);
  const buildController = (setCharacter, characterClient) => (
    new PcCharacterController(setCharacter, () => {}, () => {}, null, undefined, characterClient)
  );

  describe('#mergePrivateDescription', function() {
    it('merges the private description into the character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);
      const fullResponse = { json: () => Promise.resolve({ private_description: 'Secret notes.' }) };

      await controller.mergePrivateDescription(fullResponse, { id: 2 }, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, private_description: 'Secret notes.' });
    });
  });

  describe('#loadFullCharacter', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('sets the character without fetching full detail when can_edit is false', function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchPcFull']);
      const result = buildController(setCharacter, characterClient)
        .loadFullCharacter({ id: 2, can_edit: false }, params, null, safeSet);

      expect(characterClient.fetchPcFull).not.toHaveBeenCalled();
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
      expect(result).toBeUndefined();
    });

    it('fetches full detail when can_edit is true', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = jasmine.createSpyObj('characterClient', ['fetchPcFull']);

      characterClient.fetchPcFull.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ private_description: 'Secret notes.' }),
      }));

      await buildController(setCharacter, characterClient)
        .loadFullCharacter({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(characterClient.fetchPcFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: true, private_description: 'Secret notes.',
      });
    });
  });
});
