import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#resetPassword', function() {
    it('posts the token and password to the reset-password endpoint', async function() {
      const client = new AuthClient();

      await client.resetPassword('tok-123', 'new-secret');

      expect(fetchSpy).toHaveBeenCalledWith('/users/reset-password.json', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ token: 'tok-123', password: 'new-secret' }),
      });
    });
  });
});
