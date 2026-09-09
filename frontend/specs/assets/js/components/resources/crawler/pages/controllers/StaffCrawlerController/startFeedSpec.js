import StaffCrawlerController
  from '../../../../../../../../../assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController.js';
import { buildClient, buildContext, buildEmissions, buildResponse } from './support.js';

const PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 10000;

/**
 * @description Wires `setEmissions` so functional updates accumulate against a real array,
 *   mimicking React state, and returns an accessor for the accumulated result.
 * @param {jasmine.Spy} setEmissionsSpy - The `setEmissions` spy to wire.
 * @returns {Function} Returns the currently accumulated emissions array.
 */
function collectEmissions(setEmissionsSpy) {
  let state = [];

  setEmissionsSpy.and.callFake((updater) => {
    state = updater(state);
  });

  return () => state;
}

describe('StaffCrawlerController', function() {
  let context;
  let client;
  let controller;
  let getEmissions;

  beforeEach(function() {
    context = buildContext();
    client = buildClient();
    getEmissions = collectEmissions(context.setEmissions);
    controller = new StaffCrawlerController(
      context.setLoading, context.setError, context.setEmissions, context.setSelectedId, client,
    );
  });

  describe('#startFeed', function() {
    it('drains a full page and stops draining once a short page is returned', async function() {
      const fullPage = buildEmissions(PAGE_SIZE, 1);
      const shortPage = buildEmissions(3, PAGE_SIZE + 1);

      client.fetchEmissions.and.returnValues(
        Promise.resolve(buildResponse(fullPage)),
        Promise.resolve(buildResponse(shortPage)),
      );

      await controller.startFeed();

      expect(client.fetchEmissions.calls.count()).toBe(2);
      expect(client.fetchEmissions.calls.argsFor(0)).toEqual([undefined, null]);
      expect(client.fetchEmissions.calls.argsFor(1)).toEqual([PAGE_SIZE, null]);
      expect(getEmissions()).toEqual([...fullPage, ...shortPage]);

      controller.stopFeed();
    });

    it('drains every full page in sequence before stopping', async function() {
      const firstPage = buildEmissions(PAGE_SIZE, 1);
      const secondPage = buildEmissions(PAGE_SIZE, PAGE_SIZE + 1);
      const thirdPage = buildEmissions(5, 2 * PAGE_SIZE + 1);

      client.fetchEmissions.and.returnValues(
        Promise.resolve(buildResponse(firstPage)),
        Promise.resolve(buildResponse(secondPage)),
        Promise.resolve(buildResponse(thirdPage)),
      );

      await controller.startFeed();

      expect(client.fetchEmissions.calls.count()).toBe(3);
      expect(getEmissions()).toEqual([...firstPage, ...secondPage, ...thirdPage]);

      controller.stopFeed();
    });

    describe('once caught up', function() {
      beforeEach(function() {
        jasmine.clock().install();
      });

      afterEach(function() {
        controller.stopFeed();
        jasmine.clock().uninstall();
      });

      it('polls again every 10 seconds using the last drained id as the cursor', async function() {
        const shortPage = buildEmissions(3, 1);

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(shortPage)));

        await controller.startFeed();

        expect(client.fetchEmissions.calls.count()).toBe(1);

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse([])));
        jasmine.clock().tick(POLL_INTERVAL_MS);
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchEmissions.calls.count()).toBe(2);
        expect(client.fetchEmissions.calls.argsFor(1)).toEqual([3, null]);
      });

      it('appends newly polled records without duplicating already-seen ones', async function() {
        const shortPage = buildEmissions(2, 1);
        const polledPage = buildEmissions(2, 3);

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(shortPage)));
        await controller.startFeed();

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(polledPage)));
        jasmine.clock().tick(POLL_INTERVAL_MS);
        await Promise.resolve();
        await Promise.resolve();

        expect(getEmissions()).toEqual([...shortPage, ...polledPage]);
      });

      it('never advances the cursor when a poll tick returns no new records', async function() {
        const shortPage = buildEmissions(2, 1);

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(shortPage)));
        await controller.startFeed();

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse([])));
        jasmine.clock().tick(POLL_INTERVAL_MS);
        await Promise.resolve();
        await Promise.resolve();

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(buildEmissions(1, 3))));
        jasmine.clock().tick(POLL_INTERVAL_MS);
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchEmissions.calls.argsFor(2)).toEqual([2, null]);
      });

      it('reports a poll failure without stopping the interval', async function() {
        const shortPage = buildEmissions(2, 1);

        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(shortPage)));
        await controller.startFeed();

        client.fetchEmissions.and.returnValue(Promise.reject(new Error('network error')));
        jasmine.clock().tick(POLL_INTERVAL_MS);
        await Promise.resolve();
        await Promise.resolve();

        expect(context.setError).toHaveBeenCalledWith('Unable to load crawler feed.');

        context.setError.calls.reset();
        client.fetchEmissions.and.returnValue(Promise.resolve(buildResponse(buildEmissions(1, 3))));
        jasmine.clock().tick(POLL_INTERVAL_MS);
        await Promise.resolve();
        await Promise.resolve();

        expect(client.fetchEmissions.calls.count()).toBe(3);
        expect(context.setError).not.toHaveBeenCalled();
      });
    });

    it('reports a drain failure once and does not start polling', async function() {
      client.fetchEmissions.and.returnValue(Promise.reject(new Error('network error')));

      await controller.startFeed();

      expect(context.setError).toHaveBeenCalledOnceWith('Unable to load crawler feed.');
      expect(getEmissions()).toEqual([]);
    });
  });
});
