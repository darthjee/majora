import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#denyAuthorizationRequest', function() {
    itSendsAuthHeader({
      call: (token) => new AuthClient().denyAuthorizationRequest(token, 'some-uuid'),
      url: '/account/authorization_requests/some-uuid/deny.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({}),
    });
  });
});
