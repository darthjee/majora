import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchAccount', function() {
    it('sends the auth token when present', async function() {
      const client = new AuthClient();

      await client.fetchAccount('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/account.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
          Authorization: 'Token abc123',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new AuthClient();

      await client.fetchAccount(null);

      expect(fetchSpy).toHaveBeenCalledWith('/users/account.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });
});
