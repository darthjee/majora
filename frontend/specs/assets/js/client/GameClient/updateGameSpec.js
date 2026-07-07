import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateGame', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().updateGame('demo', token, { name: 'New Name' }),
      url: '/games/demo.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'New Name' }),
      token: 'tok-abc',
    });
  });
});
