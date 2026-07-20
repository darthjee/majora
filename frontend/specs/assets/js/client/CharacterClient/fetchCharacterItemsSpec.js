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
        url: '/games/demo/pcs/2/items.json?per_page=5',
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterItems('npcs', 'demo', '2', token),
        url: '/games/demo/npcs/2/items.json?per_page=5',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    describe('with an explicit perPage', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterItems('pcs', 'demo', '2', token, 10),
        url: '/games/demo/pcs/2/items.json?per_page=10',
      });
    });
  });
});
