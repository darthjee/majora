import StaffCrawlerController
  from '../../../../../../../../../assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController.js';
import { buildClient, buildContext, buildEmissions, buildResponse } from './support.js';

const POLL_INTERVAL_MS = 10000;

describe('StaffCrawlerController', function() {
  let context;
  let client;
  let controller;

  beforeEach(function() {
    context = buildContext();
    client = buildClient();
    controller = new StaffCrawlerController(
      context.setLoading, context.setError, context.setEmissions, context.setSelectedId, client,
    );
  });

  describe('#stopFeed', function() {
    it('is safe to call before any feed has started', function() {
      expect(() => controller.stopFeed()).not.toThrow();
    });

    it('clears the polling interval so the client is no longer polled', async function() {
      jasmine.clock().install();

      try {
        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(buildEmissions(2, 1))));
        await controller.startFeed();

        expect(client.fetchEmissions.calls.count()).toBe(1);

        controller.stopFeed();
        jasmine.clock().tick(POLL_INTERVAL_MS * 3);
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchEmissions.calls.count()).toBe(1);
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('is safe to call twice', async function() {
      client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(buildEmissions(2, 1))));
      await controller.startFeed();

      expect(() => {
        controller.stopFeed();
        controller.stopFeed();
      }).not.toThrow();
    });
  });
});
