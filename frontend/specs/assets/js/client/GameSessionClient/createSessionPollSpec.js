import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameSessionClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#createSessionPoll', function() {
    itSendsAuthHeader({
      call: (token) => new GameSessionClient().createSessionPoll(
        'demo', 42, token, ['2024-01-01', '2024-01-02'], 'multiple',
      ),
      url: '/games/demo/sessions/42/poll.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ dates: ['2024-01-01', '2024-01-02'], type: 'multiple' }),
      token: 'tok-abc',
    });
  });
});
