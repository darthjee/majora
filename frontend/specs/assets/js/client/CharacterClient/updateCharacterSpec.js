import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateCharacter', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().updateCharacter('pcs', 'demo', '2', token, { name: 'Aragorn' }),
        url: '/games/demo/pcs/2.json',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ name: 'Aragorn' }),
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().updateCharacter('npcs', 'demo', '2', token, { name: 'Goblin King' }),
        url: '/games/demo/npcs/2.json',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ name: 'Goblin King' }),
      });
    });
  });
});
