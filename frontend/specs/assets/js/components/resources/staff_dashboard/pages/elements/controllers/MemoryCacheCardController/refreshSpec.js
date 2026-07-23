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

  describe('#refresh', function() {
    it('re-fetches and sets the summary on success', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({ size: 20, limit: 100 })));

      await new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client).refresh();

      expect(setSummary).toHaveBeenCalledWith({ size: 20, limit: 100 });
    });

    it('sets an error when the response is not ok', async function() {
      client.fetchSummary.and.returnValue(Promise.resolve(mockFetchJson({}, { ok: false })));

      await new MemoryCacheCardController(setSummary, setStatus, setLoading, setError, client).refresh();

      expect(setError).toHaveBeenCalledWith(true);
    });
  });
});
