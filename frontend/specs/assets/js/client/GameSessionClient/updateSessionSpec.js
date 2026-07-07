import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameSessionClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateSession', function() {
    itSendsAuthHeader({
      call: (token) => new GameSessionClient().updateSession('demo', 42, token, { title: 'Session 1 renamed' }),
      url: '/games/demo/sessions/42.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ title: 'Session 1 renamed' }),
      token: 'tok-abc',
    });
  });
});
