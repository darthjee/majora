import PcCharacterEditController
  from '../../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('PcCharacterEditController#handleSubmit', function() {
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
    characterClient = jasmine.createSpyObj('characterClient', ['fetchPc', 'updatePc']);
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
  });

  it('navigates to the show page on success', async function() {
    characterClient.updatePc.and.returnValue(Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 2, name: 'Aragorn', can_edit: true }),
    }));

    const controller = new PcCharacterEditController(
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
      await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

      expect(characterClient.updatePc).toHaveBeenCalledWith(
        'demo', '2', 'tok-abc', { name: 'Aragorn' },
      );
      expect(fakeWindow.location.hash).toBe('/games/demo/pcs/2');
      expect(setFieldErrors).not.toHaveBeenCalled();
      expect(setError).not.toHaveBeenCalled();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets per-field errors on a 400 response without navigating', async function() {
    characterClient.updatePc.and.returnValue(Promise.resolve({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ errors: { level: ['must be a positive integer'] } }),
    }));

    const controller = new PcCharacterEditController(
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
    characterClient.updatePc.and.returnValue(Promise.resolve({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ errors: { detail: ['authentication required'] } }),
    }));

    const controller = new PcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );

    await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

    expect(setError).toHaveBeenCalledWith('Unable to save character.');
    expect(setFieldErrors).not.toHaveBeenCalled();
  });

  it('sets a general error on a 403 response', async function() {
    characterClient.updatePc.and.returnValue(Promise.resolve({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ errors: { detail: ['not allowed to edit this character'] } }),
    }));

    const controller = new PcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );

    await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

    expect(setError).toHaveBeenCalledWith('Unable to save character.');
    expect(setFieldErrors).not.toHaveBeenCalled();
  });

  it('sets a general error when the request rejects', async function() {
    characterClient.updatePc.and.returnValue(Promise.reject(new Error('network')));

    const controller = new PcCharacterEditController(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      client,
      characterClient,
    );

    await controller.handleSubmit('demo', '2', { name: 'Aragorn' });

    expect(setError).toHaveBeenCalledWith('Unable to save character.');
  });
});
