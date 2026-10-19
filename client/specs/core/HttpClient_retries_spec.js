import { Config } from '../../src/core/Config.js';
import { HttpClient } from '../../src/core/HttpClient.js';
import { NetworkError } from '../../src/core/errors/NetworkError.js';
import { NotFoundError } from '../../src/core/errors/NotFoundError.js';
import { ServerError } from '../../src/core/errors/ServerError.js';
import { FetchStub } from '../support/FetchStub.js';

describe('HttpClient retries and timeouts', () => {
  let stub;
  let sleep;
  let http;

  const buildClient = (options = {}) => new HttpClient(new Config({
    baseUrl: 'https://majora.example.com', token: 'mjr_token', fetch: stub.fetch, env: {}, ...options,
  }), { sleep, random: () => 0.5 });

  beforeEach(() => {
    stub = new FetchStub();
    sleep = jasmine.createSpy('sleep').and.resolveTo();
    http = buildClient();
  });

  describe('retry matrix', () => {
    const failures = {
      'a network error': (s) => s.fail(new TypeError('fetch failed')),
      429: (s) => s.reply(429),
      502: (s) => s.reply(502, '<html>Bad Gateway</html>'),
      503: (s) => s.reply(503),
      504: (s) => s.reply(504),
    };
    const finalFailures = {
      400: (s) => s.reply(400, { errors: { name: ['blank'] } }),
      401: (s) => s.reply(401),
      403: (s) => s.reply(403),
      404: (s) => s.reply(404),
      500: (s) => s.reply(500),
    };
    const writes = {
      POST: () => http.post('games/x/npcs', { name: 'Bob' }),
      PATCH: () => http.patch('games/x/npcs/1', { name: 'Bob' }),
      DELETE: () => http.delete('games/x/photos/1'),
    };

    Object.entries(failures).forEach(([name, queueFailure]) => {
      it(`retries a GET on ${name}`, async () => {
        queueFailure(stub);
        stub.reply(200, { ok: true });

        expect((await http.get('games')).body).toEqual({ ok: true });
        expect(stub.calls.length).toEqual(2);
        expect(sleep).toHaveBeenCalledTimes(1);
      });

      Object.entries(writes).forEach(([method, send]) => {
        it(`never retries a ${method} on ${name}`, async () => {
          queueFailure(stub);
          stub.reply(200, { ok: true });

          await expectAsync(send()).toBeRejected();
          expect(stub.calls.length).toEqual(1);
          expect(sleep).not.toHaveBeenCalled();
        });
      });
    });

    Object.entries(finalFailures).forEach(([status, queueFailure]) => {
      it(`does not retry a GET on ${status}`, async () => {
        queueFailure(stub);
        stub.reply(200, { ok: true });

        await expectAsync(http.get('games')).toBeRejectedWith(jasmine.objectContaining({ status: Number(status) }));
        expect(stub.calls.length).toEqual(1);
        expect(sleep).not.toHaveBeenCalled();
      });
    });
  });

  describe('retry count', () => {
    it('retries twice by default with a growing backoff, then surfaces the last error', async () => {
      stub.reply(502).reply(503).reply(504);

      await expectAsync(http.get('games')).toBeRejectedWith(jasmine.objectContaining({
        constructor: ServerError, status: 504,
      }));
      expect(stub.calls.length).toEqual(3);
      expect(sleep.calls.allArgs()).toEqual([[500], [1000]]);
    });

    it('does not retry with retries: 0 in the config', async () => {
      http = buildClient({ retries: 0 });
      stub.reply(503).reply(200, {});

      await expectAsync(http.get('games')).toBeRejectedWithError(ServerError);
      expect(stub.calls.length).toEqual(1);
    });

    it('lets a call override the retries', async () => {
      stub.reply(503).reply(503).reply(503).reply(200, { ok: true });

      expect((await http.get('games', { retries: 3 })).body).toEqual({ ok: true });
      expect(stub.calls.length).toEqual(4);

      stub.reply(503);
      await expectAsync(http.get('games', { retries: 0 })).toBeRejectedWithError(ServerError);
    });

    it('stops at the first non-retryable error', async () => {
      stub.reply(503).reply(404);

      await expectAsync(http.get('games')).toBeRejectedWithError(NotFoundError);
      expect(stub.calls.length).toEqual(2);
    });
  });

  describe('Retry-After', () => {
    it('waits the given seconds on a 429', async () => {
      stub.reply(429, null, { 'Retry-After': '7' }).reply(200, {});
      await http.get('games');

      expect(sleep).toHaveBeenCalledOnceWith(7000);
    });

    it('waits until the given HTTP date on a 429', async () => {
      const date = new Date(Date.now() + 60000).toUTCString();

      stub.reply(429, null, { 'Retry-After': date }).reply(200, {});
      await http.get('games');

      const [delay] = sleep.calls.mostRecent().args;

      expect(delay).toBeGreaterThan(55000);
      expect(delay).toBeLessThanOrEqual(60000);
    });

    it('uses the backoff when a 429 has no Retry-After', async () => {
      stub.reply(429).reply(200, {});
      await http.get('games');

      expect(sleep).toHaveBeenCalledOnceWith(500);
    });

    it('does not expose Retry-After on the error', async () => {
      http = buildClient({ retries: 0 });
      stub.reply(429, null, { 'Retry-After': '7' });

      await expectAsync(http.get('games')).toBeRejectedWith(jasmine.objectContaining({ status: 429 }));
    });
  });

  describe('timeouts', () => {
    it('raises NetworkError with timeout true and the abort reason as cause', async () => {
      http = buildClient({ retries: 0, timeout: 5 });
      stub.hang();

      await expectAsync(http.get('games')).toBeRejectedWith(jasmine.objectContaining({
        constructor: NetworkError,
        timeout: true,
        message: 'Timeout on GET /games.json',
        cause: jasmine.objectContaining({ name: 'TimeoutError' }),
      }));
    });

    it('lets a call override the timeout', async () => {
      http = buildClient({ retries: 0 });
      stub.hang();

      await expectAsync(http.get('games', { timeout: 5 })).toBeRejectedWith(jasmine.objectContaining({ timeout: true }));
    });

    it('retries a GET after a timeout, with a fresh signal per attempt', async () => {
      http = buildClient({ timeout: 5 });
      stub.hang().reply(200, { ok: true });

      expect((await http.get('games')).body).toEqual({ ok: true });
      expect(stub.calls[0].options.signal.aborted).toBeTrue();
      expect(stub.calls[1].options.signal).not.toBe(stub.calls[0].options.signal);
    });

    it('sends no signal with timeout: 0 and no caller signal', async () => {
      http = buildClient({ timeout: 0 });
      stub.reply(200, {});
      await http.get('games');

      expect(stub.lastCall.options.signal).toBeUndefined();
    });

    it('passes the caller signal as is with timeout: 0', async () => {
      const controller = new AbortController();

      stub.reply(200, {});
      await http.get('games', { timeout: 0, signal: controller.signal });

      expect(stub.lastCall.options.signal).toBe(controller.signal);
    });
  });

  describe('caller abort', () => {
    it('raises NetworkError with timeout false and is not retried', async () => {
      const controller = new AbortController();

      stub.hang().reply(200, {});
      const promise = http.get('games', { signal: controller.signal });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      controller.abort();

      await expectAsync(promise).toBeRejectedWith(jasmine.objectContaining({
        constructor: NetworkError, timeout: false, message: 'Request aborted on GET /games.json',
      }));
      expect(stub.calls.length).toEqual(1);
      expect(sleep).not.toHaveBeenCalled();
    });

    it('fails immediately with an already aborted signal', async () => {
      const controller = new AbortController();

      controller.abort();
      stub.hang();

      await expectAsync(http.get('games', { signal: controller.signal }))
        .toBeRejectedWith(jasmine.objectContaining({ constructor: NetworkError, timeout: false }));
    });
  });

  describe('default sleep', () => {
    it('waits with a real timer when no sleep is injected', async () => {
      http = new HttpClient(new Config({
        baseUrl: 'https://majora.example.com', token: 'mjr_token', fetch: stub.fetch, env: {},
      }));
      stub.reply(429, null, { 'Retry-After': '0' }).reply(200, { ok: true });

      expect((await http.get('games')).body).toEqual({ ok: true });
    });
  });
});
