import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('StaffUserClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchUsers', function() {
    itSendsAuthHeader({
      call: (token) => new StaffUserClient().fetchUsers(token),
      url: '/staff/users.json',
      token: 'tok-abc',
    });

    it('appends pagination params to the query string', async function() {
      const client = new StaffUserClient();
      const params = new URLSearchParams({ page: '2', per_page: '10' });

      await client.fetchUsers('tok-abc', params);

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users.json?page=2&per_page=10', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      }));
    });
  });
});
