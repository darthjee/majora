import CrawlerClient from '../../../../assets/js/client/CrawlerClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../support/fetchMock.js';

describe('CrawlerClient', function() {
  beforeEach(function() {
    stubFetchJson([]);
  });

  describe('#fetchEmissions', function() {
    itSendsAuthHeader({
      call: (token) => new CrawlerClient().fetchEmissions(undefined, token),
      url: '/staff/crawler.json',
      token: 'tok-abc',
    });

    it('omits the last_id param when lastId is undefined', async function() {
      await new CrawlerClient().fetchEmissions(undefined, 'tok-abc');

      expect(globalThis.fetch).toHaveBeenCalledWith('/staff/crawler.json', jasmine.any(Object));
    });

    it('omits the last_id param when lastId is null', async function() {
      await new CrawlerClient().fetchEmissions(null, 'tok-abc');

      expect(globalThis.fetch).toHaveBeenCalledWith('/staff/crawler.json', jasmine.any(Object));
    });

    it('includes the last_id param when lastId is given', async function() {
      await new CrawlerClient().fetchEmissions(42, 'tok-abc');

      expect(globalThis.fetch).toHaveBeenCalledWith('/staff/crawler.json?last_id=42', jasmine.any(Object));
    });
  });
});
