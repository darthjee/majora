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

  describe('#clearEmissions', function() {
    it('sets status to loading, then success, and refreshes the counts on success', async function() {
      client.clearEmissions.and.returnValue(Promise.resolve({ ok: true }));
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ stl_model: 0 })));

      await new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client).clearEmissions();

      expect(setStatus).toHaveBeenCalledWith('loading');
      expect(setStatus).toHaveBeenCalledWith('success');
      expect(setCounts).toHaveBeenCalledWith({ stl_model: 0 });
    });

    it('sets status to error and does not refresh when the response is not ok', async function() {
      client.clearEmissions.and.returnValue(Promise.resolve({ ok: false }));

      await new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client).clearEmissions();

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(client.fetchSummary).not.toHaveBeenCalled();
    });

    it('sets status to error when the request rejects', async function() {
      client.clearEmissions.and.returnValue(Promise.reject(new Error('network error')));

      await new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client).clearEmissions();

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
