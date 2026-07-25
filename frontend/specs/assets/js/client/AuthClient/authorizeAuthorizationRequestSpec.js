import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#authorizeAuthorizationRequest', function() {
    itSendsAuthHeader({
      call: (token) => new AuthClient().authorizeAuthorizationRequest(token, 'some-uuid', 'secret'),
      url: '/account/authorization_requests/some-uuid/authorize.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ password: 'secret' }),
    });
  });
});
