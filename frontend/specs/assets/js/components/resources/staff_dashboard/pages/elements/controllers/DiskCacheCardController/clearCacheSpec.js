import DiskCacheCardController from '../../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/DiskCacheCardController.js';
import { mockFetchJson } from '../../../../../../../../../support/fetchMock.js';
import { buildContext } from './support.js';

describe('DiskCacheCardController', function() {
  let setSize;
  let setStatus;
  let setLoading;
  let setError;
  let client;

  beforeEach(function() {
    ({ setSize, setStatus, setLoading, setError, client } = buildContext());
  });

  describe('#clearCache', function() {
    it('sets status to loading, then success, and refreshes the size on success', async function() {
      client.clearDiskCache.and.returnValue(Promise.resolve({ ok: true }));
      client.fetchDiskCacheSize.and.returnValue(Promise.resolve(mockFetchJson({ size: 0 })));

      await new DiskCacheCardController(setSize, setStatus, setLoading, setError, client).clearCache();

      expect(setStatus).toHaveBeenCalledWith('loading');
      expect(setStatus).toHaveBeenCalledWith('success');
      expect(setSize).toHaveBeenCalledWith(0);
    });

    it('sets status to error and does not refresh when the response is not ok', async function() {
      client.clearDiskCache.and.returnValue(Promise.resolve({ ok: false }));

      await new DiskCacheCardController(setSize, setStatus, setLoading, setError, client).clearCache();

      expect(setStatus).toHaveBeenCalledWith('error');
      expect(client.fetchDiskCacheSize).not.toHaveBeenCalled();
    });

    it('sets status to error when the request rejects', async function() {
      client.clearDiskCache.and.returnValue(Promise.reject(new Error('network error')));

      await new DiskCacheCardController(setSize, setStatus, setLoading, setError, client).clearCache();

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
