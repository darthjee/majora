import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchGame', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().fetchGame('demo', token),
      url: '/games/demo.json',
      token: 'tok-abc',
    });
  });
});
