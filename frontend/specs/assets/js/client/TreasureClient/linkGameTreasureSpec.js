import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#linkGameTreasure', function() {
    itSendsAuthHeader({
      call: (token) => new TreasureClient().linkGameTreasure('demo', token, {
        treasure_id: 9, value: 100, hidden: false, max_units: null,
      }),
      url: '/games/demo/treasures/link.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({
        treasure_id: 9, value: 100, hidden: false, max_units: null,
      }),
      token: 'tok-abc',
    });
  });
});
