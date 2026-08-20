import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('AuthClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#headerStatus', function() {
    itSendsAuthHeader({
      call: (token) => new AuthClient().headerStatus(token),
      url: '/users/header_status.json',
      headers: { 'X-Skip-Cache': 'true' },
    });
  });
});
