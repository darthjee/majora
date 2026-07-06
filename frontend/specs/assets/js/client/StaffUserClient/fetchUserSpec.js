import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';

describe('StaffUserClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
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
});
