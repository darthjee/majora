import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#removeItemAll', function() {
    it('sends a POST request with the fields and auth token for a PC', async function() {
      const client = new CharacterClient();

      await client.removeItemAll('pcs', 'demo', '2', 'abc123', { game_item_id: 9 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/items/remove/all.json', jasmine.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ game_item_id: 9 }),
      }));
    });

    it('sends a POST request with the fields and auth token for an NPC', async function() {
      const client = new CharacterClient();

      await client.removeItemAll('npcs', 'demo', '2', 'abc123', { game_item_id: 9 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/items/remove/all.json', jasmine.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ game_item_id: 9 }),
      }));
    });
  });
});
