import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateCharacterMoney', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().updateCharacterMoney('pcs', 'demo', '2', token, 500),
        url: '/games/demo/pcs/2/money.json',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ money: 500 }),
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().updateCharacterMoney('npcs', 'demo', '2', token, 300),
        url: '/games/demo/npcs/2/money.json',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ money: 300 }),
      });
    });
  });
});
