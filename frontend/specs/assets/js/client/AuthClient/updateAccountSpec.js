import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#updateAccount', function() {
    it('sends a PATCH with the account fields and the auth token', async function() {
      const client = new AuthClient();

      await client.updateAccount('abc123', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secret',
        passwordConfirmation: 'secret',
      });

      expect(fetchSpy).toHaveBeenCalledWith('/users/account.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
          Authorization: 'Token abc123',
        },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'secret',
          password_confirmation: 'secret',
        }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new AuthClient();

      await client.updateAccount(null, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: '',
        passwordConfirmation: '',
      });

      expect(fetchSpy).toHaveBeenCalledWith('/users/account.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: '',
          password_confirmation: '',
        }),
      });
    });
  });
});
