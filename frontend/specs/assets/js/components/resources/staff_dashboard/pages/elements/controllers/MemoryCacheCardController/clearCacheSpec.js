import MemoryCacheCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js';
import { mockFetchJson } from '../../../../../../../../../support/fetchMock.js';
import { buildContext } from './support.js';

describe('MemoryCacheCardController', function() {
  let setSummary;
  let setStatus;
  let setLoading;
  let setError;
  let client;

  beforeEach(function() {
    ({ setSummary, setStatus, setLoading, setError, client } = buildContext());
  });

  describe('#clearCache', function() {
    it('sets status to loading, then success, and refreshes the summary on success', async function() {
      client.clearCache.and.returnValue(Promise.resolve({ ok: true }));
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ size: 0, limit: 100 })));

      await new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client).clearCache();

      expect(setStatus).toHaveBeenCalledWith('loading');
      expect(setStatus).toHaveBeenCalledWith('success');
      expect(setSummary).toHaveBeenCalledWith({ size: 0, limit: 100 });
    });

    it('sets status to error and does not refresh when the response is not ok', async function() {
      client.clearCache.and.returnValue(Promise.resolve({ ok: false }));

      await new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client).clearCache();

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(client.fetchSummary).not.toHaveBeenCalled();
    });

    it('sets status to error when the request rejects', async function() {
      client.clearCache.and.returnValue(Promise.reject(new Error('network error')));

      await new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client).clearCache();

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
