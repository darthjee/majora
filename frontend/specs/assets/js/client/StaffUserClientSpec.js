import StaffUserClient from '../../../../assets/js/client/StaffUserClient.js';

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

  describe('#fetchUser', function() {
    it('sends the auth token when present', async function() {
      const client = new StaffUserClient();

      await client.fetchUser(42, 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users/42.json', {
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

      await client.fetchUser(42, null);

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users/42.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
  });

  describe('#updateUser', function() {
    it('sends a PATCH request with the fields and auth token when present', async function() {
      const client = new StaffUserClient();

      await client.updateUser(42, 'tok-abc', { name: 'Jane', email: 'jane@example.com' });

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Jane', email: 'jane@example.com' }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new StaffUserClient();

      await client.updateUser(42, null, { name: 'Jane' });

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'Jane' }),
      });
    });
  });

  describe('#fetchRecoveryLink', function() {
    it('sends a POST request with no body and the auth token when present', async function() {
      const client = new StaffUserClient();

      await client.fetchRecoveryLink(42, 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users/42/recovery-link.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new StaffUserClient();

      await client.fetchRecoveryLink(42, null);

      expect(fetchSpy).toHaveBeenCalledWith('/staff/users/42/recovery-link.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });
});
