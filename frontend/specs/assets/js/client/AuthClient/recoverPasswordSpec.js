import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#recoverPassword', function() {
    it('posts the email to the recover endpoint', async function() {
      const client = new AuthClient();

      await client.recoverPassword('user@example.com');

      expect(fetchSpy).toHaveBeenCalledWith('/users/recover.json', jasmine.objectContaining({
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }));
    });
  });
});
