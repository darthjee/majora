import StaffUserClient from '../../../../../assets/js/client/StaffUserClient.js';

describe('StaffUserClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
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
