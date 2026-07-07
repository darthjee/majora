import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchGameTreasuresPage', function() {
    it('requests the game treasures endpoint with page, per_page, and max_value query params', async function() {
      const client = new TreasureClient();

      await client.fetchGameTreasuresPage('demo', 'tok-abc', { page: 2, perPage: 5, maxValue: 500 });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/treasures.json?page=2&per_page=5&max_value=500', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      });
    });

    it('omits query params when not provided', async function() {
      const client = new TreasureClient();

      await client.fetchGameTreasuresPage('demo', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/treasures.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });

    it('omits max_value when it is null', async function() {
      const client = new TreasureClient();

      await client.fetchGameTreasuresPage('demo', 'tok-abc', { page: 1, perPage: 10, maxValue: null });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/treasures.json?page=1&per_page=10', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      });
    });
  });
});
