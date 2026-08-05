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

  describe('#refresh', function() {
    it('re-fetches and sets the size on success', async function() {
      client.fetchDiskCacheSize.and.returnValue(Promise.resolve(mockFetchJson({ size: 20 })));

      await new DiskCacheCardController(setSize, setStatus, setLoading, setError, client).refresh();

      expect(setSize).toHaveBeenCalledWith(20);
    });

    it('sets an error when the response is not ok', async function() {
      client.fetchDiskCacheSize.and.returnValue(Promise.resolve(mockFetchJson({}, { ok: false })));

      await new DiskCacheCardController(setSize, setStatus, setLoading, setError, client).refresh();

      expect(setError).toHaveBeenCalledWith(true);
    });

    it('does not touch status (silent refresh)', async function() {
      client.fetchDiskCacheSize.and.returnValue(Promise.resolve(mockFetchJson({ size: 20 })));

      await new DiskCacheCardController(setSize, setStatus, setLoading, setError, client).refresh();

      expect(setStatus).not.toHaveBeenCalled();
    });

    it('cancels a pending automatic retry timer', async function() {
      jasmine.clock().install();

      try {
        client.fetchDiskCacheSize.and.returnValues(
          Promise.reject(new Error('network error')),
          Promise.resolve(mockFetchJson({ size: 42 })),
        );

        const controller = new DiskCacheCardController(setSize, setStatus, setLoading, setError, client);
        const cleanup = controller.buildEffect()();

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(1);

        await controller.refresh();

        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(2);
        expect(setSize).toHaveBeenCalledWith(42);

        jasmine.clock().tick(60000);
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(2);

        cleanup();
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });
});
