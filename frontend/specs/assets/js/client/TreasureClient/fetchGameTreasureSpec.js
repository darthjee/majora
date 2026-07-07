import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchGameTreasure', function() {
    itSendsAuthHeader({
      call: (token) => new TreasureClient().fetchGameTreasure('demo', 42, token),
      url: '/games/demo/treasures/42.json',
      token: 'tok-abc',
    });
  });
});
