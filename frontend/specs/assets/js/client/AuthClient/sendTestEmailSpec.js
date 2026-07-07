import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#sendTestEmail', function() {
    it('posts to the test-email endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.sendTestEmail('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/test-email.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });
});
