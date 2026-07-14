import ResilientRequest from '../../../../assets/js/client/ResilientRequest.js';
import ResilienceEvents from '../../../../assets/js/utils/ResilienceEvents.js';

/**
 * Flushes a handful of pending microtasks, letting already-settled
 * promise chains (that do not depend on a timer) fully resolve.
 *
 * @param {number} [times] - number of microtask ticks to flush.
 * @returns {Promise<void>} resolves once every flush tick has run.
 */
async function flushMicrotasks(times = 5) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

describe('ResilientRequest', function() {
  describe('#run', function() {
    it('resolves with the response on a successful first attempt', async function() {
      const attempt = jasmine.createSpy('attempt').and.returnValue(Promise.resolve({ status: 200 }));
      const request = new ResilientRequest(attempt);

      const response = await request.run();

      expect(response).toEqual({ status: 200 });
      expect(attempt).toHaveBeenCalledTimes(1);
    });

    it('retries past a single 502 response before resolving', async function() {
      const attempt = jasmine.createSpy('attempt').and.returnValues(
        Promise.resolve({ status: 502 }),
        Promise.resolve({ status: 200 })
      );
      const request = new ResilientRequest(attempt, { retryDelayMs: 1 });

      const response = await request.run();

      expect(response).toEqual({ status: 200 });
      expect(attempt).toHaveBeenCalledTimes(2);
    });

    it('retries past several 502 responses before resolving', async function() {
      const attempt = jasmine.createSpy('attempt').and.returnValues(
        Promise.resolve({ status: 502 }),
        Promise.resolve({ status: 502 }),
        Promise.resolve({ status: 200 })
      );
      const request = new ResilientRequest(attempt, { retryDelayMs: 1 });

      const response = await request.run();

      expect(response).toEqual({ status: 200 });
      expect(attempt).toHaveBeenCalledTimes(3);
    });

    it('retries past a timeout rejection before resolving', async function() {
      const timeoutError = new Error('The operation timed out.');
      timeoutError.name = 'TimeoutError';

      const attempt = jasmine.createSpy('attempt').and.returnValues(
        Promise.reject(timeoutError),
        Promise.resolve({ status: 200 })
      );
      const request = new ResilientRequest(attempt, { retryDelayMs: 1 });

      const response = await request.run();

      expect(response).toEqual({ status: 200 });
      expect(attempt).toHaveBeenCalledTimes(2);
    });

    it('retries past a mix of 502 responses and timeout rejections before resolving', async function() {
      const timeoutError = new Error('The operation timed out.');
      timeoutError.name = 'TimeoutError';

      let callCount = 0;
      // Build each promise lazily, at call time, instead of eagerly in a
      // `returnValues` array: an eagerly-created rejected promise sitting
      // unconsumed across a real setTimeout wait would trip Node's
      // unhandled-rejection detector before it is ever awaited.
      const attempt = jasmine.createSpy('attempt').and.callFake(() => {
        callCount += 1;

        if (callCount === 1) {
          return Promise.resolve({ status: 502 });
        }
        if (callCount === 2) {
          return Promise.reject(timeoutError);
        }
        return Promise.resolve({ status: 200 });
      });
      const request = new ResilientRequest(attempt, { retryDelayMs: 1 });

      const response = await request.run();

      expect(response).toEqual({ status: 200 });
      expect(attempt).toHaveBeenCalledTimes(3);
    });

    it('does not retry a 404 response', async function() {
      const attempt = jasmine.createSpy('attempt').and.returnValue(Promise.resolve({ status: 404 }));
      const request = new ResilientRequest(attempt, { retryDelayMs: 1 });

      const response = await request.run();

      expect(response).toEqual({ status: 404 });
      expect(attempt).toHaveBeenCalledTimes(1);
    });

    it('does not retry a 500 response', async function() {
      const attempt = jasmine.createSpy('attempt').and.returnValue(Promise.resolve({ status: 500 }));
      const request = new ResilientRequest(attempt, { retryDelayMs: 1 });

      const response = await request.run();

      expect(response).toEqual({ status: 500 });
      expect(attempt).toHaveBeenCalledTimes(1);
    });

    it('propagates a non-timeout thrown error immediately without retrying', async function() {
      const error = new Error('network down');
      const attempt = jasmine.createSpy('attempt').and.returnValue(Promise.reject(error));
      const request = new ResilientRequest(attempt, { retryDelayMs: 1 });

      await expectAsync(request.run()).toBeRejectedWith(error);
      expect(attempt).toHaveBeenCalledTimes(1);
    });

    it('stops retrying once cancelled and never resolves with a final success', async function() {
      const attempt = jasmine.createSpy('attempt').and.returnValue(Promise.resolve({ status: 502 }));
      const cancelToken = { cancelled: false };
      const request = new ResilientRequest(attempt, { retryDelayMs: 5 });

      const promise = request.run(cancelToken);

      cancelToken.cancelled = true;

      const response = await promise;

      expect(response).toEqual({ status: 502 });
      expect(attempt).toHaveBeenCalledTimes(1);
    });

    it('drives ResilienceEvents through a full retry cycle', async function() {
      jasmine.clock().install();

      try {
        const attempt = jasmine.createSpy('attempt').and.returnValues(
          Promise.resolve({ status: 502 }),
          Promise.resolve({ status: 200 })
        );
        const request = new ResilientRequest(attempt, { retryDelayMs: 1000 });

        expect(ResilienceEvents.getStatus()).toBe('idle');

        const promise = request.run();

        await flushMicrotasks();
        expect(ResilienceEvents.getStatus()).toBe('retrying');

        jasmine.clock().tick(1000);
        await flushMicrotasks();

        const response = await promise;

        expect(response).toEqual({ status: 200 });
        expect(ResilienceEvents.getStatus()).toBe('idle');
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });
});
