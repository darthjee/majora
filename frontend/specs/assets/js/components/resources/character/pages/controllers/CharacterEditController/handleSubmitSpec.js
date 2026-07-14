import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import { KINDS } from './support.js';

KINDS.forEach(({ label, Controller, kind, name }) => {
  describe(`${label}#handleSubmit`, function() {
    let setCharacter;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let setters;
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
      setStatus = jasmine.createSpy('setStatus');
      setters = { setStatus, setFieldErrors };
      client = jasmine.createSpyObj('client', ['currentHash']);
      characterClient = jasmine.createSpyObj('characterClient', ['fetchCharacter', 'updateCharacter']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
    });

    it('navigates to the show page on success', async function() {
      characterClient.updateCharacter.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 2, name, can_edit: true }),
      }));

      const controller = new Controller(
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
        await controller.handleSubmit('demo', '2', { name }, setters);

        expect(characterClient.updateCharacter).toHaveBeenCalledWith(
          kind, 'demo', '2', 'tok-abc', { name },
        );
        expect(fakeWindow.location.hash).toBe(`/games/demo/${kind}/2`);
        expect(setFieldErrors).not.toHaveBeenCalled();
        expect(setError).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets per-field errors on a 400 response without navigating', async function() {
      characterClient.updateCharacter.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { level: ['must be a positive integer'] } }),
      }));

      const controller = new Controller(
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
        await controller.handleSubmit('demo', '2', { level: -1 }, setters);

        expect(setFieldErrors).toHaveBeenCalledWith({ level: ['must be a positive integer'] });
        expect(setError).not.toHaveBeenCalled();
        expect(fakeWindow.location.hash).toBe('');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets status to error on a 401 response', async function() {
      characterClient.updateCharacter.and.returnValue(Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ errors: { detail: ['authentication required'] } }),
      }));

      const controller = new Controller(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
        characterClient,
      );

      await controller.handleSubmit('demo', '2', { name }, setters);

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setError).not.toHaveBeenCalled();
      expect(setFieldErrors).not.toHaveBeenCalled();
    });

    it('sets status to error on a 403 response', async function() {
      characterClient.updateCharacter.and.returnValue(Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ errors: { detail: ['not allowed to edit this character'] } }),
      }));

      const controller = new Controller(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
        characterClient,
      );

      await controller.handleSubmit('demo', '2', { name }, setters);

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setError).not.toHaveBeenCalled();
      expect(setFieldErrors).not.toHaveBeenCalled();
    });

    it('sets status to error when the request rejects', async function() {
      characterClient.updateCharacter.and.returnValue(Promise.reject(new Error('network')));

      const controller = new Controller(
        setCharacter,
        setLoading,
        setError,
        setFieldErrors,
        client,
        characterClient,
      );

      await controller.handleSubmit('demo', '2', { name }, setters);

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(setError).not.toHaveBeenCalled();
    });
  });
});
