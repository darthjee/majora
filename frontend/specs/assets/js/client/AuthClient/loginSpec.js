import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#login', function() {
    it('posts credentials to the login endpoint', async function() {
      const client = new AuthClient();

      await client.login('majora-user', 'secret');

      expect(fetchSpy).toHaveBeenCalledWith('/users/login.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ username: 'majora-user', password: 'secret' }),
      });
    });
  });
});
