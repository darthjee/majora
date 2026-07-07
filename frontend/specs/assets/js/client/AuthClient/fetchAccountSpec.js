import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchAccount', function() {
    itSendsAuthHeader({
      call: (token) => new AuthClient().fetchAccount(token),
      url: '/users/account.json',
      headers: { 'X-Skip-Cache': 'true' },
    });
  });
});
