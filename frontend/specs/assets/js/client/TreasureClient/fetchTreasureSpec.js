import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchTreasure', function() {
    itSendsAuthHeader({
      call: (token) => new TreasureClient().fetchTreasure(42, token),
      url: '/treasures/42.json',
      token: 'tok-abc',
    });
  });
});
