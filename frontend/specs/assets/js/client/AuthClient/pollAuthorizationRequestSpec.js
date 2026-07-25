import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#pollAuthorizationRequest', function() {
    it('sends the X-Authorize-Token header to the polling endpoint', async function() {
      const client = new AuthClient();

      await client.pollAuthorizationRequest('some-uuid', 'authorize-tok');

      expect(fetchSpy).toHaveBeenCalledWith('/users/authorization_requests/some-uuid.json', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Authorize-Token': 'authorize-tok',
          'X-Skip-Cache': 'true',
        },
      }));
    });

    it('does not send an Authorization header', async function() {
      const client = new AuthClient();

      await client.pollAuthorizationRequest('some-uuid', 'authorize-tok');

      const [, options] = fetchSpy.calls.mostRecent().args;

      expect(options.headers.Authorization).toBeUndefined();
    });

    it('forwards an abort signal when given', async function() {
      const client = new AuthClient();
      const controller = new AbortController();

      await client.pollAuthorizationRequest('some-uuid', 'authorize-tok', controller.signal);

      expect(fetchSpy).toHaveBeenCalledWith('/users/authorization_requests/some-uuid.json', jasmine.objectContaining({
        signal: controller.signal,
      }));
    });
  });
});
