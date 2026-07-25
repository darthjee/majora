import StaffUsersController from '../../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUsersController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildContext, stubAccessStore } from './support.js';

describe('StaffUsersController', function() {
  let setUsers;
  let setPagination;
  let setLoading;
  let setError;
  let ensureSpy;
  let originalWindow;

  beforeEach(function() {
    ({ setUsers, setPagination, setLoading, setError } = buildContext());
    ensureSpy = spyOn(RequestStore, 'ensure');
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#buildEffect', function() {
    it('fetches users and pagination when the user is staff or superuser', async function() {
      stubAccessStore(true);
      ensureSpy.and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Jane', email: 'jane@example.com' }],
        pagination: {
          page: 1, pages: 2, perPage: 10, total: 11,
        },
      }));

      const cleanup = new StaffUsersController(
        setUsers, setPagination, setLoading, setError,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffUsersController',
        resource: 'staffUser',
        quantityType: 'collection',
        query: {},
      });
      expect(setUsers).toHaveBeenCalledWith([{ id: 1, name: 'Jane', email: 'jane@example.com' }]);
      expect(setPagination).toHaveBeenCalledWith({
        page: 1, pages: 2, perPage: 10, total: 11,
      });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets error when the fetch fails', async function() {
      stubAccessStore(true);
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new StaffUsersController(
        setUsers, setPagination, setLoading, setError,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load users.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('merges the status/search filter params and pagination params into the query', async function() {
      stubAccessStore(true);
      globalThis.window = { location: { hash: '#/staff/users?status=pending&search=jane&page=2' } };
      ensureSpy.and.returnValue(Promise.resolve({
        data: [],
        pagination: {
          page: 2, pages: 2, perPage: 10, total: 11,
        },
      }));

      const cleanup = new StaffUsersController(
        setUsers, setPagination, setLoading, setError,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffUsersController',
        resource: 'staffUser',
        quantityType: 'collection',
        query: { page: '2', status: 'pending', search: 'jane' },
      });

      cleanup();
    });

    it('redirects to home and does not fetch when the user is neither staff nor superuser', async function() {
      stubAccessStore(false);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        const cleanup = new StaffUsersController(
          setUsers, setPagination, setLoading, setError,
        ).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
        expect(ensureSpy).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });
  });
});
