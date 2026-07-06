import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#logout', function() {
    it('sends a DELETE to the logout endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.logout('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/logout.json', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
          Authorization: 'Token abc123',
        },
        body: undefined,
      });
    });
  });
});
