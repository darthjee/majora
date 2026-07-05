import StaffUserEditController, { getStaffUserIdFromEditHash }
  from '../../../../../../assets/js/components/pages/controllers/StaffUserEditController.js';
import AuthStorage from '../../../../../../assets/js/utils/AuthStorage.js';

describe('StaffUserEditController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts user id from an edit hash', function() {
    expect(getStaffUserIdFromEditHash('#/staff/users/42/edit')).toBe('42');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(getStaffUserIdFromEditHash('#/staff/users/42')).toBe('');
  });

  describe('#buildEffect', function() {
    let setUser;
    let setLoading;
    let setError;
    let client;
    let authClient;
    let fakeWindow;

    beforeEach(function() {
      setUser = jasmine.createSpy('setUser');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      client = jasmine.createSpyObj('client', ['fetchUser', 'updateUser']);
      authClient = jasmine.createSpyObj('authClient', ['status']);
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: true }),
      }));
      fakeWindow = { location: { hash: '#/staff/users/1/edit' } };
      globalThis.window = fakeWindow;
      client.fetchUser.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Jane', email: 'jane@example.com' }),
      }));
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const buildController = () => new StaffUserEditController(
      setUser, setLoading, setError, () => {}, client, authClient,
    );

    it('fetches the user and calls setUser with the result', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchUser).toHaveBeenCalledWith('1', null);
      expect(setUser).toHaveBeenCalledWith({ id: 1, name: 'Jane', email: 'jane@example.com' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the user fetch fails', async function() {
      client.fetchUser.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setUser).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sends the token when the user is authenticated', async function() {
      AuthStorage.setToken('tok-abc');

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchUser).toHaveBeenCalledWith('1', 'tok-abc');

      cleanup();
    });

    it('redirects to home and does not fetch when the user is neither staff nor superuser', async function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: false, is_staff: false }),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(client.fetchUser).not.toHaveBeenCalled();

      cleanup();
    });
  });

  describe('#submitForm', function() {
    let setUser;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let client;

    beforeEach(function() {
      setUser = jasmine.createSpy('setUser');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      client = jasmine.createSpyObj('client', ['updateUser']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      client.updateUser.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'Jane', email: 'jane@example.com' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new StaffUserEditController(
        setUser, setLoading, setError, setFieldErrors, client,
      );
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          '1',
          { name: 'Jane', email: 'jane@example.com' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(client.updateUser).toHaveBeenCalledWith(
          '1', 'tok-abc', { name: 'Jane', email: 'jane@example.com' },
        );
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the user detail page on success', async function() {
      const controller = new StaffUserEditController(
        setUser, setLoading, setError, setFieldErrors, client,
      );
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          '5',
          { name: 'Jane', email: 'jane@example.com' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/staff/users/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      client.updateUser.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { email: ['is already taken'] } }),
      }));

      const controller = new StaffUserEditController(
        setUser, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Jane', email: 'taken@example.com' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ email: ['is already taken'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      client.updateUser.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new StaffUserEditController(
        setUser, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Jane', email: 'jane@example.com' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      client.updateUser.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new StaffUserEditController(
        setUser, setLoading, setError, setFieldErrors, client,
      );

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Jane', email: 'jane@example.com' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
