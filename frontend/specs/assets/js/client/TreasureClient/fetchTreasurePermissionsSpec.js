import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchTreasurePermissions', function() {
    itSendsAuthHeader({
      call: (token) => new TreasureClient().fetchTreasurePermissions(42, token),
      url: '/treasures/42/permissions.json',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });

    it('serializes roles as repeated role= query params', async function() {
      await new TreasureClient().fetchTreasurePermissions(42, null, undefined, ['superuser']);

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42/permissions.json?role=superuser', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      });
    });
  });
});
