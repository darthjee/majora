import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameSessionClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createSession', function() {
    itSendsAuthHeader({
      call: (token) => new GameSessionClient().createSession(
        'demo', token, { title: 'Session 1', date: token ? '2024-01-01' : null },
      ),
      url: '/games/demo/sessions.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: (token) => JSON.stringify({ title: 'Session 1', date: token ? '2024-01-01' : null }),
      token: 'tok-abc',
    });
  });
});
