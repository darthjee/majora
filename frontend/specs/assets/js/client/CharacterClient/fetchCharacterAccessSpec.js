import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchCharacterAccess', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterAccess('pcs', 'demo', '2', token),
        url: '/games/demo/pcs/2/access.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterAccess('npcs', 'demo', '2', token),
        url: '/games/demo/npcs/2/access.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });
  });
});
