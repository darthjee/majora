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

  describe('#buildEffect', function() {
    it('sets the counts and clears loading on a successful fetch', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ stl_model: 42, collection: 7 })));

      const cleanup = new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCounts).toHaveBeenCalledWith({ stl_model: 42, collection: 7 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the response is not ok', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({}, { ok: false })));

      const cleanup = new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the request rejects', async function() {
      client.fetchSummary.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ stl_model: 42 })));

      const cleanup = new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCounts).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
