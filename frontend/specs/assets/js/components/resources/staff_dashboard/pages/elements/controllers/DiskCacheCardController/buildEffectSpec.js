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

  describe('#buildEffect', function() {
    it('sets the size and clears loading on a successful fetch', async function() {
      client.fetchDiskCacheSize.and.returnValue(Promise.resolve(mockFetchJson({ size: 128 })));

      const cleanup = new DiskCacheCardController(setSize, setStatus, setLoading, setError, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setSize).toHaveBeenCalledWith(128);
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and schedules a retry when the response is not ok', async function() {
      jasmine.clock().install();

      try {
        client.fetchDiskCacheSize.and.returnValues(
          Promise.resolve(mockFetchJson({}, { ok: false })),
          Promise.resolve(mockFetchJson({ size: 256 })),
        );

        const cleanup = new DiskCacheCardController(setSize, setStatus, setLoading, setError, client)
          .buildEffect()();

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(setError).toHaveBeenCalledWith(true);
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(1);

        jasmine.clock().tick(60000);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(2);
        expect(setSize).toHaveBeenCalledWith(256);
        expect(setError).toHaveBeenCalledWith(false);

        cleanup();
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('sets an error and schedules a retry when the request rejects', async function() {
      jasmine.clock().install();

      try {
        client.fetchDiskCacheSize.and.returnValues(
          Promise.reject(new Error('network error')),
          Promise.resolve(mockFetchJson({ size: 512 })),
        );

        const cleanup = new DiskCacheCardController(setSize, setStatus, setLoading, setError, client)
          .buildEffect()();

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(setError).toHaveBeenCalledWith(true);
        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(1);

        jasmine.clock().tick(60000);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(2);
        expect(setSize).toHaveBeenCalledWith(512);

        cleanup();
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('does not update state after unmount', async function() {
      client.fetchDiskCacheSize.and.returnValue(Promise.resolve(mockFetchJson({ size: 128 })));

      const cleanup = new DiskCacheCardController(setSize, setStatus, setLoading, setError, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setSize).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });

    it('clears the retry timer on unmount so it does not fire again', async function() {
      jasmine.clock().install();

      try {
        client.fetchDiskCacheSize.and.returnValue(Promise.reject(new Error('network error')));

        const cleanup = new DiskCacheCardController(setSize, setStatus, setLoading, setError, client)
          .buildEffect()();

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(1);

        cleanup();

        jasmine.clock().tick(60000);
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchDiskCacheSize).toHaveBeenCalledTimes(1);
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });
});
