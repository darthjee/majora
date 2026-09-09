import CrawlerDebugCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/CrawlerDebugCardController.js';
import { mockFetchJson } from '../../../../../../../../../support/fetchMock.js';
import { buildContext } from './support.js';

describe('CrawlerDebugCardController', function() {
  let setCounts;
  let setStatus;
  let setLoading;
  let setError;
  let client;

  beforeEach(function() {
    ({ setCounts, setStatus, setLoading, setError, client } = buildContext());
  });

  describe('#refresh', function() {
    it('re-fetches and sets the counts on success', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ stl_model: 20, collection: 3 })));

      await new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client).refresh();

      expect(setCounts).toHaveBeenCalledWith({ stl_model: 20, collection: 3 });
    });

    it('sets an error when the response is not ok', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({}, { ok: false })));

      await new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client).refresh();

      expect(setError).toHaveBeenCalledWith(true);
    });
  });
});
