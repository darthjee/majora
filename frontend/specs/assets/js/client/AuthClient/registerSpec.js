import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#register', function() {
    it('posts the registration fields to the register endpoint', async function() {
      const client = new AuthClient();

      await client.register('Jane Doe', 'Jane', 'jane@example.com', 'secret', 'secret');

      expect(fetchSpy).toHaveBeenCalledWith('/users/register.json', jasmine.objectContaining({
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({
          name: 'Jane Doe',
          display_name: 'Jane',
          email: 'jane@example.com',
          password: 'secret',
          password_confirmation: 'secret',
        }),
      }));
    });
  });
});
