import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#setLanguagePreference', function() {
    it('posts the language to the language endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.setLanguagePreference('abc123', 'en');

      expect(fetchSpy).toHaveBeenCalledWith('/users/language.json', jasmine.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
          Authorization: 'Token abc123',
        },
        body: JSON.stringify({ language: 'en' }),
      }));
    });
  });
});
