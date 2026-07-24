import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createItem', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().createItem('demo', token, { name: 'Sword' }),
      url: '/games/demo/items.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'Sword' }),
      token: 'tok-abc',
    });
  });
});
