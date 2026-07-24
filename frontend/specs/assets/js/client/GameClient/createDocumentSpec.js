import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createDocument', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().createDocument('demo', token, { name: 'Ancient Scroll' }),
      url: '/games/demo/documents.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'Ancient Scroll' }),
      token: 'tok-abc',
    });
  });
});
