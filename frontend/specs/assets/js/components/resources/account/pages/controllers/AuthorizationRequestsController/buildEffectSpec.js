import AuthorizationRequestsController from '../../../../../../../../../assets/js/components/resources/account/pages/controllers/AuthorizationRequestsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('AuthorizationRequestsController', function() {
  let setRequests;
  let setPagination;
  let setLoading;
  let client;
  let fakeWindow;

  beforeEach(function() {
    setRequests = jasmine.createSpy('setRequests');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    client = jasmine.createSpyObj('client', [
      'listAuthorizationRequests', 'denyAuthorizationRequest', 'authorizeAuthorizationRequest',
    ]);
    fakeWindow = { location: { hash: '#/account/authorization_requests' } };
    globalThis.window = fakeWindow;
    client.listAuthorizationRequests.and.returnValue(Promise.resolve({
      ok: true,
      headers: { get: () => null },
      json: () => Promise.resolve([{ uuid: 'a', status: 'open' }]),
    }));
  });

  afterEach(function() {
    delete globalThis.window;
    AuthStorage.clearToken();
  });

  const buildController = () => new AuthorizationRequestsController(
    setRequests, setPagination, setLoading, client,
  );

  describe('#buildEffect', function() {
    it('fetches the requests and sets them along with pagination', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.listAuthorizationRequests).toHaveBeenCalled();
      expect(setRequests).toHaveBeenCalledWith([{ uuid: 'a', status: 'open' }]);
      expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('forwards the page and per_page hash params', async function() {
      fakeWindow.location.hash = '#/account/authorization_requests?page=2&per_page=5';

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.listAuthorizationRequests).toHaveBeenCalledWith(null, { page: '2', perPage: '5' });

      cleanup();
    });

    it('sends the token when the user is authenticated', async function() {
      AuthStorage.setToken('tok-abc');

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.listAuthorizationRequests).toHaveBeenCalledWith('tok-abc', jasmine.any(Object));

      cleanup();
    });

    it('defaults to an empty array when the response body is not an array', async function() {
      client.listAuthorizationRequests.and.returnValue(Promise.resolve({
        ok: true,
        headers: { get: () => null },
        json: () => Promise.resolve({}),
      }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setRequests).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('redirects to home when the fetch fails', async function() {
      client.listAuthorizationRequests.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');
      expect(setRequests).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('redirects to home when the fetch throws', async function() {
      client.listAuthorizationRequests.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeWindow.location.hash).toBe('/');

      cleanup();
    });
  });
});
