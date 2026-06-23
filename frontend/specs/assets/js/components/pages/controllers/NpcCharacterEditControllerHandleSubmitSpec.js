import NpcCharacterEditController
  from '../../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('NpcCharacterEditController#handleSubmit', function() {
  let setCharacter;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let characterClient;

  afterEach(function() {
    AuthStorage.clearToken();
  });

  beforeEach(function() {
    setCharacter = jasmine.createSpy('setCharacter');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash']);
    characterClient = jasmine.createSpyObj('characterClient', ['fetchNpc', 'updateNpc']);
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
  });

  it('navigates to the show page on success', async function() {
    characterClient.updateNpc.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 2, name: 'Goblin King', can_edit: true }),
    }));

    const controller = new NpcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );
    const fakeWindow = { location: { hash: '' } };
    globalThis.window = fakeWindow;

    try {
      await controller.handleSubmit('demo', '2', { name: 'Goblin King' });

      expect(characterClient.updateNpc).toHaveBeenCalledWith(
        'demo', '2', 'tok-abc', { name: 'Goblin King' },
      );
      expect(fakeWindow.location.hash).toBe('/games/demo/npcs/2');
      expect(setFieldErrors).not.toHaveBeenCalled();
      expect(setError).not.toHaveBeenCalled();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets per-field errors on a 400 response without navigating', async function() {
    characterClient.updateNpc.and.returnValue(Promise.resolve({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ errors: { level: ['must be a positive integer'] } }),
    }));

    const controller = new NpcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );
    const fakeWindow = { location: { hash: '' } };
    globalThis.window = fakeWindow;

    try {
      await controller.handleSubmit('demo', '2', { level: -1 });

      expect(setFieldErrors).toHaveBeenCalledWith({ level: ['must be a positive integer'] });
      expect(setError).not.toHaveBeenCalled();
      expect(fakeWindow.location.hash).toBe('');
    } finally {
      delete globalThis.window;
    }
  });

  it('sets a general error on a 401 response', async function() {
    characterClient.updateNpc.and.returnValue(Promise.resolve({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ errors: { detail: ['authentication required'] } }),
    }));

    const controller = new NpcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );

    await controller.handleSubmit('demo', '2', { name: 'Goblin King' });

    expect(setError).toHaveBeenCalledWith('Unable to save character.');
    expect(setFieldErrors).not.toHaveBeenCalled();
  });

  it('sets a general error on a 403 response', async function() {
    characterClient.updateNpc.and.returnValue(Promise.resolve({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ errors: { detail: ['not allowed to edit this character'] } }),
    }));

    const controller = new NpcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );

    await controller.handleSubmit('demo', '2', { name: 'Goblin King' });

    expect(setError).toHaveBeenCalledWith('Unable to save character.');
    expect(setFieldErrors).not.toHaveBeenCalled();
  });

  it('sets a general error when the request rejects', async function() {
    characterClient.updateNpc.and.returnValue(Promise.reject(new Error('network')));

    const controller = new NpcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );

    await controller.handleSubmit('demo', '2', { name: 'Goblin King' });

    expect(setError).toHaveBeenCalledWith('Unable to save character.');
  });
});
