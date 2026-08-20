import DomainClient from '../../../../assets/js/client/DomainClient.js';
import { stubFetchJson } from '../../../support/fetchMock.js';

describe('DomainClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson({ favicon: null, title: 'Majora', sub_title: 'RPG' });
  });

  describe('#config', function() {
    it('fetches the domain-config endpoint without a token', async function() {
      await new DomainClient().config();

      expect(fetchSpy).toHaveBeenCalledWith('/domain/config.json', jasmine.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      }));
    });
  });
});
