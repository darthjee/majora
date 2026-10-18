import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  beforeEach(function() {
    stubFetchJson({ id: 2 });
  });

  describe('#fetchCharacterAt', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterAt('pcs', '/games/demo/pcs/2.json', token),
        url: '/games/demo/pcs/2.json',
      });
    });

    describe('for an NPC plain path', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterAt('npcs', '/games/demo/npcs/2.json', token),
        url: '/games/demo/npcs/2.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    describe('for an NPC full path', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterAt('npcs', '/games/demo/npcs/2/full.json', token),
        url: '/games/demo/npcs/2/full.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    it('resolves to the fetch response', async function() {
      const response = await new CharacterClient().fetchCharacterAt('pcs', '/games/demo/pcs/2.json', null);

      expect(response.ok).toBeTrue();
    });
  });
});
