import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateTreasure', function() {
    itSendsAuthHeader({
      call: (token) => new TreasureClient().updateTreasure(42, token, { name: 'Golden Sword' }),
      url: '/treasures/42.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'Golden Sword' }),
      token: 'tok-abc',
    });
  });
});
