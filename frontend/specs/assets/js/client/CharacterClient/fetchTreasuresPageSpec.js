import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchTreasuresPage', function() {
    it('requests the pc treasures endpoint with page and per_page query params', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresPage('pcs', 'demo', '2', 'abc123', { page: 2, perPage: 5 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json?page=2&per_page=5', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
        },
        body: undefined,
      }));
    });

    it('omits query params when not provided for a PC', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresPage('pcs', 'demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      }));
    });

    it('requests the npc treasures endpoint with page and per_page query params', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresPage('npcs', 'demo', '2', 'abc123', { page: 3, perPage: 10 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json?page=3&per_page=10', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      }));
    });

    it('sends the X-Skip-Cache header when there is no token for an NPC', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresPage('npcs', 'demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures.json', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      }));
    });

    it('sends the search value as the name query param when provided', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresPage('pcs', 'demo', '2', 'abc123', { page: 1, perPage: 10, search: 'sword' });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/pcs/2/treasures.json?page=1&per_page=10&name=sword',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token abc123',
          },
          body: undefined,
        }),
      );
    });
  });
});
