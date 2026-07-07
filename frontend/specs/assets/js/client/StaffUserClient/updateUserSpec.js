import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffUserClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateUser', function() {
    itSendsAuthHeader({
      call: (token) => new StaffUserClient().updateUser(
        42, token, token ? { name: 'Jane', email: 'jane@example.com' } : { name: 'Jane' },
      ),
      url: '/staff/users/42.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: (token) => JSON.stringify(token ? { name: 'Jane', email: 'jane@example.com' } : { name: 'Jane' }),
      token: 'tok-abc',
    });
  });
});
