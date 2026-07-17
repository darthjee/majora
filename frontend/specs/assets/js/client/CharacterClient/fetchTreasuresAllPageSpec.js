import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchTreasuresAllPage', function() {
    it('requests the npc treasures/all endpoint with page and per_page query params', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresAllPage('demo', '2', 'abc123', { page: 3, perPage: 10 });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/npcs/2/treasures/all.json?page=3&per_page=10',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token abc123',
            'X-Skip-Cache': 'true',
          },
          body: undefined,
        }),
      );
    });

    it('omits query params when not provided', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresAllPage('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/treasures/all.json', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      }));
    });

    it('includes the name query param when provided', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresAllPage('demo', '2', 'abc123', { page: 1, perPage: 10, name: 'sword' });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/npcs/2/treasures/all.json?page=1&per_page=10&name=sword',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token abc123',
            'X-Skip-Cache': 'true',
          },
          body: undefined,
        }),
      );
    });

    it('includes the min_value and max_value query params when provided', async function() {
      const client = new CharacterClient();

      await client.fetchTreasuresAllPage('demo', '2', 'abc123', {
        page: 1, perPage: 10, min_value: '10', max_value: '100',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/npcs/2/treasures/all.json?page=1&per_page=10&min_value=10&max_value=100',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token abc123',
            'X-Skip-Cache': 'true',
          },
          body: undefined,
        }),
      );
    });
  });
});
