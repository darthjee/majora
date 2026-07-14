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
        url: '/games/demo/pcs/2/permissions.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterPermissions('npcs', 'demo', '2', token),
        url: '/games/demo/npcs/2/permissions.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    it('serializes roles as repeated role= query params', async function() {
      await new CharacterClient().fetchCharacterPermissions('pcs', 'demo', '2', null, undefined, ['dm', 'owner']);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/permissions.json?role=dm&role=owner', jasmine.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      }));
    });
  });
});
