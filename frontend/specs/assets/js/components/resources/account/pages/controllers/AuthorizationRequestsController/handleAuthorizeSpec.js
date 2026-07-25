import AuthorizationRequestsController from '../../../../../../../../../assets/js/components/resources/account/pages/controllers/AuthorizationRequestsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('AuthorizationRequestsController', function() {
  let setRequests;
  let setPagination;
  let setLoading;
  let client;

  beforeEach(function() {
    setRequests = jasmine.createSpy('setRequests');
    setPagination = jasmine.createSpy('setPagination');
    setLoading = jasmine.createSpy('setLoading');
    client = jasmine.createSpyObj('client', ['listAuthorizationRequests', 'authorizeAuthorizationRequest']);
    globalThis.window = { location: { hash: '#/account/authorization_requests' } };
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
    client.listAuthorizationRequests.and.returnValue(Promise.resolve({
      ok: true,
      headers: { get: () => null },
      json: () => Promise.resolve([]),
    }));
  });

  afterEach(function() {
    delete globalThis.window;
  });

  const buildController = () => new AuthorizationRequestsController(
    setRequests, setPagination, setLoading, client,
  );

  describe('#handleAuthorize', function() {
    it('authorizes the request with the given password and refreshes the list on success', async function() {
      client.authorizeAuthorizationRequest.and.returnValue(Promise.resolve({ ok: true, status: 202 }));

      const result = await buildController().handleAuthorize('some-uuid', 'secret');

      expect(client.authorizeAuthorizationRequest).toHaveBeenCalledWith('tok-abc', 'some-uuid', 'secret');
      expect(client.listAuthorizationRequests).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('does not refresh the list on an invalid password', async function() {
      client.authorizeAuthorizationRequest.and.returnValue(Promise.resolve({ ok: false, status: 401 }));

      const result = await buildController().handleAuthorize('some-uuid', 'wrong');

      expect(client.listAuthorizationRequests).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false });
    });

    it('resolves with ok: false when the client rejects', async function() {
      client.authorizeAuthorizationRequest.and.returnValue(Promise.reject(new Error('network error')));

      const result = await buildController().handleAuthorize('some-uuid', 'secret');

      expect(result).toEqual({ ok: false });
    });
  });
});
