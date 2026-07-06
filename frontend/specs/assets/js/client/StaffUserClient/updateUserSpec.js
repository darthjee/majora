import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';

describe('StaffUserClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
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
});
