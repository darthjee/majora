import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchGameAccess', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().fetchGameAccess('demo', token),
      url: '/games/demo/access.json',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });
  });
});
