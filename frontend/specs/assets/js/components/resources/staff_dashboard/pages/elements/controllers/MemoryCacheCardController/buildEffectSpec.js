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

  describe('#buildEffect', function() {
    it('sets the summary and clears loading on a successful fetch', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ size: 10, limit: 100 })));

      const cleanup = new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setSummary).toHaveBeenCalledWith({ size: 10, limit: 100 });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the response is not ok', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({}, { ok: false })));

      const cleanup = new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error when the request rejects', async function() {
      client.fetchSummary.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ size: 10, limit: 100 })));

      const cleanup = new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setSummary).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
