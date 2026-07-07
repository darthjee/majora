import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchTreasureAccess', function() {
    itSendsAuthHeader({
      call: (token) => new TreasureClient().fetchTreasureAccess(42, token),
      url: '/treasures/42/access.json',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });
  });
});
