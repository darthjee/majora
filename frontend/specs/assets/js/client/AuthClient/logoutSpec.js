import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#logout', function() {
    it('sends a DELETE to the logout endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.logout('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/logout.json', jasmine.objectContaining({
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
          Authorization: 'Token abc123',
        },
        body: undefined,
      }));
    });
  });
});
