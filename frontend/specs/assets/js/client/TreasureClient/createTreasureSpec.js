import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createTreasure', function() {
    itSendsAuthHeader({
      call: (token) => new TreasureClient().createTreasure(token, { name: 'Sword', value: 100 }),
      url: '/treasures.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'Sword', value: 100 }),
      token: 'tok-abc',
    });
  });
});
