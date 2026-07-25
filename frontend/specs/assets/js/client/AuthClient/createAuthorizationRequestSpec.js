import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#createAuthorizationRequest', function() {
    it('posts the username to the authorization-requests endpoint', async function() {
      const client = new AuthClient();

      await client.createAuthorizationRequest('majora-user');

      expect(fetchSpy).toHaveBeenCalledWith('/users/authorization_requests.json', jasmine.objectContaining({
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ username: 'majora-user' }),
      }));
    });
  });
});
