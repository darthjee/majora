import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#status', function() {
    itSendsAuthHeader({
      call: (token) => new AuthClient().status(token),
      url: '/users/status.json',
      headers: { 'X-Skip-Cache': 'true' },
    });
  });
});
