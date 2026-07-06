import StaffUsersController from '../../../../../../../assets/js/components/pages/controllers/StaffUsersController.js';
import { buildContext } from './support.js';

describe('StaffUsersController', function() {
  let setUsers;
  let setPagination;
  let setLoading;
  let setError;
  let client;
  let authClient;

  beforeEach(function() {
    ({ setUsers, setPagination, setLoading, setError, client, authClient } = buildContext());
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
});
