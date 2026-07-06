import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#register', function() {
    it('posts the registration fields to the register endpoint', async function() {
      const client = new AuthClient();

      await client.register('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(fetchSpy).toHaveBeenCalledWith('/users/register.json', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'secret',
          password_confirmation: 'secret',
        }),
      });
    });
  });
});
