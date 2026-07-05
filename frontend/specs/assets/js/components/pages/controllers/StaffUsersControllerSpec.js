import StaffUsersController from '../../../../../../assets/js/components/pages/controllers/StaffUsersController.js';

describe('StaffUsersController', function() {
  let setUsers;
  let setPagination;
  let setLoading;
  let setError;
  let client;
  let authClient;

  beforeEach(function() {
    setUsers = jasmine.createSpy('setUsers');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    client = jasmine.createSpyObj('client', ['fetchUsers', 'fetchRecoveryLink']);
    authClient = jasmine.createSpyObj('authClient', ['status']);
  });

  describe('#buildEffect', function() {
    it('fetches users and pagination when the user is staff or superuser', async function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_staff: true }),
      }));
      const headers = new Map([['page', '1'], ['pages', '2'], ['per_page', '10']]);
      client.fetchUsers.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'Jane', email: 'jane@example.com' }]),
        headers: { get: (key) => headers.get(key) },
      }));

      const cleanup = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetchUsers).toHaveBeenCalled();
      expect(setUsers).toHaveBeenCalledWith([{ id: 1, name: 'Jane', email: 'jane@example.com' }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 2, perPage: 10 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the fetch fails', async function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: true }),
      }));
      client.fetchUsers.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load users.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets error when the response is not ok', async function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: true }),
      }));
      client.fetchUsers.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load users.');

      cleanup();
    });

    it('redirects to home and does not fetch when the user is neither staff nor superuser', async function() {
      authClient.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: false, is_staff: false }),
      }));
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        const cleanup = new StaffUsersController(
          setUsers, setPagination, setLoading, setError, client, authClient,
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
        expect(client.fetchUsers).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('#handleGenerateRecoveryLink', function() {
    it('marks the row as loading, then ready with the returned url on success', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'http://example.com/recover?token=abc' }),
      }));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, {}, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({ 1: { status: 'loading', url: null } });
      expect(setRecoveryLinks).toHaveBeenCalledWith({
        1: { status: 'ready', url: 'http://example.com/recover?token=abc' },
      });
    });

    it('marks the row as error when the response is not ok', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.resolve({ ok: false }));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, {}, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({ 1: { status: 'error', url: null } });
    });

    it('marks the row as error when the request throws', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.reject(new Error('network error')));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, {}, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({ 1: { status: 'error', url: null } });
    });

    it('preserves other rows already in the recovery links map', async function() {
      client.fetchRecoveryLink.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'http://example.com/recover?token=abc' }),
      }));
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');
      const existing = { 2: { status: 'ready', url: 'http://example.com/other' } };

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleGenerateRecoveryLink(1, existing, setRecoveryLinks);

      expect(setRecoveryLinks).toHaveBeenCalledWith({
        2: { status: 'ready', url: 'http://example.com/other' },
        1: { status: 'ready', url: 'http://example.com/recover?token=abc' },
      });
    });
  });

  describe('#handleCopyRecoveryLink', function() {
    let originalDescriptor;

    beforeEach(function() {
      originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    });

    afterEach(function() {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, 'navigator', originalDescriptor);
      }
    });

    const stubClipboard = (writeText) => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { clipboard: { writeText } },
        configurable: true,
      });
    };

    it('copies the url and marks the row as copied', async function() {
      const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      stubClipboard(writeText);
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );
      await controller.handleCopyRecoveryLink(1, 'http://example.com/recover', {}, setRecoveryLinks);

      expect(writeText).toHaveBeenCalledWith('http://example.com/recover');
      expect(setRecoveryLinks).toHaveBeenCalledWith({
        1: { status: 'copied', url: 'http://example.com/recover' },
      });
    });

    it('swallows clipboard errors', async function() {
      const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.reject(new Error('denied')));
      stubClipboard(writeText);
      const setRecoveryLinks = jasmine.createSpy('setRecoveryLinks');

      const controller = new StaffUsersController(
        setUsers, setPagination, setLoading, setError, client, authClient,
      );

      await expectAsync(
        controller.handleCopyRecoveryLink(1, 'http://example.com/recover', {}, setRecoveryLinks),
      ).toBeResolved();
      expect(setRecoveryLinks).not.toHaveBeenCalled();
    });
  });
});
