import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchCharacterItems', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterItems('pcs', 'demo', '2', token),
        url: '/games/demo/pcs/2/items.json',
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterItems('npcs', 'demo', '2', token),
        url: '/games/demo/npcs/2/items.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });
  });
});
