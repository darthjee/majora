import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchGameTreasuresAllPage', function() {
    it('requests the game treasures/all endpoint with page, per_page, and max_value query params', async function() {
      const client = new TreasureClient();

      await client.fetchGameTreasuresAllPage('demo', 'tok-abc', { page: 2, perPage: 5, maxValue: 500 });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/treasures/all.json?page=2&per_page=5&max_value=500',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token tok-abc',
            'X-Skip-Cache': 'true',
          },
          body: undefined,
        }),
      );
    });

    it('omits query params when not provided', async function() {
      const client = new TreasureClient();

      await client.fetchGameTreasuresAllPage('demo', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/treasures/all.json', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      }));
    });

    it('omits max_value when it is null', async function() {
      const client = new TreasureClient();

      await client.fetchGameTreasuresAllPage('demo', 'tok-abc', { page: 1, perPage: 10, maxValue: null });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/treasures/all.json?page=1&per_page=10',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token tok-abc',
            'X-Skip-Cache': 'true',
          },
          body: undefined,
        }),
      );
    });

    it('includes search and ordering query params when provided', async function() {
      const client = new TreasureClient();

      await client.fetchGameTreasuresAllPage('demo', 'tok-abc', {
        page: 1, perPage: 10, search: 'sword', ordering: 'desc',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/treasures/all.json?page=1&per_page=10&search=sword&ordering=desc',
        jasmine.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Token tok-abc',
            'X-Skip-Cache': 'true',
          },
          body: undefined,
        }),
      );
    });
  });
});
