import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createGame', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().createGame(token, { name: 'New Game' }),
      url: '/games.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'New Game' }),
      token: 'tok-abc',
    });
  });
});
