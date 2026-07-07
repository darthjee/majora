import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient slain', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#setNpcSlain', function() {
    itSendsAuthHeader({
      call: (token) => new CharacterClient().setNpcSlain('demo', '2', token, token !== null),
      url: '/games/demo/npcs/2/slain.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: (token) => JSON.stringify({ slain: token !== null }),
    });
  });
});
