import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameSessionClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchSession', function() {
    itSendsAuthHeader({
      call: (token) => new GameSessionClient().fetchSession('demo', 42, token),
      url: '/games/demo/sessions/42.json',
      token: 'tok-abc',
    });
  });
});
