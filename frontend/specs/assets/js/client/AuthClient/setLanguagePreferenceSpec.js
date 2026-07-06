import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#setLanguagePreference', function() {
    it('posts the language to the language endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.setLanguagePreference('abc123', 'en');

      expect(fetchSpy).toHaveBeenCalledWith('/users/language.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
          Authorization: 'Token abc123',
        },
        body: JSON.stringify({ language: 'en' }),
      });
    });
  });
});
