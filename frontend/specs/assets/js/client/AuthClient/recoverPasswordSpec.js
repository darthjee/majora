import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#recoverPassword', function() {
    it('posts the email to the recover endpoint', async function() {
      const client = new AuthClient();

      await client.recoverPassword('user@example.com');

      expect(fetchSpy).toHaveBeenCalledWith('/users/recover.json', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });
    });
  });
});
