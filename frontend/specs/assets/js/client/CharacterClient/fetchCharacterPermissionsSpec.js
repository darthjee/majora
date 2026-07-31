import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchCharacterPermissions', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterPermissions('pcs', 'demo', '2', token),
        url: '/permissions/game_pc.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterPermissions('npcs', 'demo', '2', token),
        url: '/permissions/game_npc.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    it('serializes roles as repeated role= query params', async function() {
      await new CharacterClient().fetchCharacterPermissions('pcs', 'demo', '2', null, undefined, ['dm', 'owner']);

      expect(fetchSpy).toHaveBeenCalledWith('/permissions/game_pc.json?role=dm&role=owner', jasmine.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      }));
    });
  });
});
