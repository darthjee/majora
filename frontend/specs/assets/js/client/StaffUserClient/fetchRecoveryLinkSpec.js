import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffUserClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchRecoveryLink', function() {
    itSendsAuthHeader({
      call: (token) => new StaffUserClient().fetchRecoveryLink(42, token),
      url: '/staff/users/42/recovery-link.json',
      method: 'POST',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });
  });
});
