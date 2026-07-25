import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#listAuthorizationRequests', function() {
    itSendsAuthHeader({
      call: (token) => new AuthClient().listAuthorizationRequests(token),
      url: '/account/authorization_requests.json',
      headers: { 'X-Skip-Cache': 'true' },
    });

    it('appends page and per_page query params when given', async function() {
      await new AuthClient().listAuthorizationRequests('tok-abc', { page: 2, perPage: 5 });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/account/authorization_requests.json?page=2&per_page=5',
        jasmine.objectContaining({ method: 'GET' }),
      );
    });

    it('omits the query string when no pagination params are given', async function() {
      await new AuthClient().listAuthorizationRequests('tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith(
        '/account/authorization_requests.json',
        jasmine.objectContaining({ method: 'GET' }),
      );
    });
  });
});
