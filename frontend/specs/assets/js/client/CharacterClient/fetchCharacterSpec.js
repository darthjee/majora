import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchCharacter', function() {
    itSendsAuthHeader({
      call: (token) => new CharacterClient().fetchCharacter('pcs', 'demo', '2', token),
      url: '/games/demo/pcs/2.json',
    });

    it('does not send the X-Skip-Cache header for a PC', async function() {
      const client = new CharacterClient();

      await client.fetchCharacter('pcs', 'demo', '2', 'abc123');

      const [, options] = fetchSpy.calls.mostRecent().args;
      expect(options.headers['X-Skip-Cache']).toBeUndefined();
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacter('npcs', 'demo', '2', token),
        url: '/games/demo/npcs/2.json',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });
  });
});
