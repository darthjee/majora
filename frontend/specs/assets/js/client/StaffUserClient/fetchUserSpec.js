import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffUserClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchUser', function() {
    itSendsAuthHeader({
      call: (token) => new StaffUserClient().fetchUser(42, token),
      url: '/staff/users/42.json',
      token: 'tok-abc',
    });
  });
});
