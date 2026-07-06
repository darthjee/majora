import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';

describe('StaffUserClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchUsers', function() {
    it('sends the auth token when present, with no query when params are empty', async function() {
      const client = new StaffUserClient();

      await client.fetchUsers('tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      });
    });

    it('appends pagination params to the query string', async function() {
      const client = new StaffUserClient();
      const params = new URLSearchParams({ page: '2', per_page: '10' });

      await client.fetchUsers('tok-abc', params);

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users.json?page=2&per_page=10', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new StaffUserClient();

      await client.fetchUsers(null);

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
  });
});
