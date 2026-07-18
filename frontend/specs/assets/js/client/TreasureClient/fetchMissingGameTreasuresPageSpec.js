import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchMissingGameTreasuresPage', function() {
    it('requests the game treasures/missing endpoint with page and per_page query params', async function() {
      const client = new TreasureClient();

      await client.fetchMissingGameTreasuresPage('demo', 'tok-abc', { page: 2, perPage: 5 });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/treasures/missing.json?page=2&per_page=5',
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

      await client.fetchMissingGameTreasuresPage('demo', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/treasures/missing.json', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      }));
    });
  });
});
