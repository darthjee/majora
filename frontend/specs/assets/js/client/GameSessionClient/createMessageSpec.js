import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameSessionClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createMessage', function() {
    itSendsAuthHeader({
      call: (token) => new GameSessionClient().createMessage('demo', 42, token, 'Hello there'),
      url: '/games/demo/sessions/42/messages.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ content: 'Hello there' }),
      token: 'tok-abc',
    });
  });
});
