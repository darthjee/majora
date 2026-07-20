import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient#createItem', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('for a PC', function() {
    itSendsAuthHeader({
      call: (token) => new CharacterClient().createItem('pcs', 'demo', '7', token, { name: 'Sword' }),
      url: '/games/demo/pcs/7/items.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'Sword' }),
    });
  });

  describe('for an NPC', function() {
    itSendsAuthHeader({
      call: (token) => new CharacterClient().createItem('npcs', 'demo', '9', token, { name: 'Sword' }),
      url: '/games/demo/npcs/9/items.json',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'Sword' }),
    });
  });
});
