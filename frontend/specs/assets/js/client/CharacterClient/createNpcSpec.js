import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient#createNpc', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  itSendsAuthHeader({
    call: (token) => new CharacterClient().createNpc('demo', token, { name: 'Goblin King' }),
    url: '/games/demo/npcs.json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
    body: JSON.stringify({ name: 'Goblin King' }),
  });
});
