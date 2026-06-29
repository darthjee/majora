import TreasureEditController, { getTreasureIdFromEditHash }
  from '../../../../../../assets/js/components/pages/controllers/TreasureEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('TreasureEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts treasure id from an edit hash', function() {
    expect(getTreasureIdFromEditHash('#/treasures/42/edit')).toBe('42');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(getTreasureIdFromEditHash('#/treasures/42')).toBe('');
  });

  describe('#buildEffect', function() {
    it('fetches treasure and access in parallel and calls setTreasure with merged result', async function() {
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const treasureClient = jasmine.createSpyObj('treasureClient', [
        'fetchTreasure', 'fetchTreasureAccess',
      ]);
      const fakeWindow = { location: { hash: '#/treasures/1/edit' } };
      globalThis.window = fakeWindow;

      treasureClient.fetchTreasure.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Sword', value: 100 }),
      }));
      treasureClient.fetchTreasureAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new TreasureEditController(
          setTreasure, setLoading, setError, () => {}, treasureClient,
        );
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(treasureClient.fetchTreasure).toHaveBeenCalledWith('1', null);
        expect(treasureClient.fetchTreasureAccess).toHaveBeenCalledWith('1', null);
        expect(setTreasure).toHaveBeenCalledWith(
          { id: 1, name: 'Sword', value: 100, can_edit: true },
        );
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets can_edit to false when access response is not ok', async function() {
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const treasureClient = jasmine.createSpyObj('treasureClient', [
        'fetchTreasure', 'fetchTreasureAccess',
      ]);
      const fakeWindow = { location: { hash: '#/treasures/1/edit' } };
      globalThis.window = fakeWindow;

      treasureClient.fetchTreasure.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Sword', value: 100 }),
      }));
      treasureClient.fetchTreasureAccess.and.returnValue(Promise.resolve({ ok: false }));

      try {
        const controller = new TreasureEditController(
          setTreasure, setLoading, setError, () => {}, treasureClient,
        );
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setTreasure).toHaveBeenCalledWith(
          jasmine.objectContaining({ can_edit: false }),
        );
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets error when the treasure fetch fails', async function() {
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const treasureClient = jasmine.createSpyObj('treasureClient', [
        'fetchTreasure', 'fetchTreasureAccess',
      ]);
      const fakeWindow = { location: { hash: '#/treasures/1/edit' } };
      globalThis.window = fakeWindow;

      treasureClient.fetchTreasure.and.returnValue(Promise.resolve({ ok: false }));
      treasureClient.fetchTreasureAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new TreasureEditController(
          setTreasure, setLoading, setError, () => {}, treasureClient,
        );
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setTreasure).not.toHaveBeenCalled();
        expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
        expect(setLoading).toHaveBeenCalledWith(false);

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sends the token when the user is authenticated', async function() {
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const treasureClient = jasmine.createSpyObj('treasureClient', [
        'fetchTreasure', 'fetchTreasureAccess',
      ]);
      const fakeWindow = { location: { hash: '#/treasures/1/edit' } };
      globalThis.window = fakeWindow;

      AuthStorage.setToken('tok-abc');

      treasureClient.fetchTreasure.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Sword', value: 100 }),
      }));
      treasureClient.fetchTreasureAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      try {
        const controller = new TreasureEditController(
          setTreasure, setLoading, setError, () => {}, treasureClient,
        );
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(treasureClient.fetchTreasure).toHaveBeenCalledWith('1', 'tok-abc');
        expect(treasureClient.fetchTreasureAccess).toHaveBeenCalledWith('1', 'tok-abc');

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('#submitForm', function() {
    let setTreasure;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let treasureClient;

    beforeEach(function() {
      setTreasure = jasmine.createSpy('setTreasure');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      treasureClient = jasmine.createSpyObj('treasureClient', ['updateTreasure']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      treasureClient.updateTreasure.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'Sword', value: 100 }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new TreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          '1',
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(treasureClient.updateTreasure).toHaveBeenCalledWith(
          '1', 'tok-abc', { name: 'Sword', value: 100 },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('parses value as integer before submission', async function() {
      const controller = new TreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          '1',
          { name: 'Ring', value: '250' },
          { setStatus, setFieldErrors },
        );

        expect(treasureClient.updateTreasure).toHaveBeenCalledWith(
          '1', 'tok-abc', { name: 'Ring', value: 250 },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the treasure detail page on success', async function() {
      const controller = new TreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          '5',
          { name: 'Sword', value: '100' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/treasures/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      treasureClient.updateTreasure.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { name: ['is too short'] } }),
      }));

      const controller = new TreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient,
      );

      await controller.submitForm(
        undefined,
        '1',
        { name: 'X', value: '1' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ name: ['is too short'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      treasureClient.updateTreasure.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new TreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient,
      );

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      treasureClient.updateTreasure.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new TreasureEditController(
        setTreasure, setLoading, setError, setFieldErrors, treasureClient,
      );

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Sword', value: '100' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
