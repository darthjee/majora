import StaffCrawlerController
  from '../../../../../../../../../assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildClient, buildContext, buildResponse, stubAccessStore } from './support.js';

describe('StaffCrawlerController', function() {
  let context;
  let client;

  beforeEach(function() {
    context = buildContext();
    client = buildClient();
    client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse([])));
  });

  describe('#buildEffect', function() {
    it('clears loading and starts the feed when the user is staff or superuser', async function() {
      stubAccessStore(true);

      const controller = new StaffCrawlerController(
        context.setLoading, context.setError, context.setEmissions, context.setSelectedId, client,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(context.setLoading).toHaveBeenCalledWith(false);
      expect(context.setError).not.toHaveBeenCalled();
      expect(client.fetchEmissions).toHaveBeenCalled();

      cleanup();
    });

    it('redirects to home and does not clear loading when the user is neither staff nor superuser', async function() {
      stubAccessStore(false);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        const controller = new StaffCrawlerController(
          context.setLoading, context.setError, context.setEmissions, context.setSelectedId, client,
        );
        const cleanup = controller.buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(fakeWindow.location.hash).toBe('/');
        expect(context.setLoading).not.toHaveBeenCalled();
        expect(client.fetchEmissions).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets error when the access check fails', async function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.reject(new Error('network error')));

      const controller = new StaffCrawlerController(
        context.setLoading, context.setError, context.setEmissions, context.setSelectedId, client,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(context.setError).toHaveBeenCalledWith('Unable to load crawler feed.');

      cleanup();
    });

    it('returns a cleanup that stops the feed so a still-running poll cannot set state after unmount', async function() {
      stubAccessStore(true);

      const controller = new StaffCrawlerController(
        context.setLoading, context.setError, context.setEmissions, context.setSelectedId, client,
      );
      const cleanup = controller.buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      context.setEmissions.calls.reset();
      cleanup();

      client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse([{ id: 1 }])));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(context.setEmissions).not.toHaveBeenCalled();
    });
  });
});
