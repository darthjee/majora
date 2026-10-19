import { RetryPolicy } from '../../src/core/RetryPolicy.js';
import { ApiError } from '../../src/core/errors/ApiError.js';
import { buildApiError } from '../../src/core/errors/buildApiError.js';
import { NetworkError } from '../../src/core/errors/NetworkError.js';

describe('RetryPolicy', () => {
  const now = Date.parse('2026-10-18T12:00:00Z');
  let random;
  let policy;
  const apiError = (status) => buildApiError({ status, method: 'GET', path: '/a.json', body: null });

  beforeEach(() => {
    random = 0.5;
    policy = new RetryPolicy({ random: () => random, now: () => now });
  });

  describe('shouldRetry', () => {
    const retried = [429, 502, 503, 504];
    const notRetried = [400, 401, 403, 404, 409, 422, 500];

    retried.forEach((status) => {
      it(`retries a GET on ${status}`, () => {
        expect(policy.shouldRetry('GET', apiError(status))).toBeTrue();
      });
    });

    notRetried.forEach((status) => {
      it(`does not retry a GET on ${status}`, () => {
        expect(policy.shouldRetry('GET', apiError(status))).toBeFalse();
      });
    });

    it('retries a GET on a network error', () => {
      expect(policy.shouldRetry('GET', new NetworkError('down'))).toBeTrue();
      expect(policy.shouldRetry('GET', new NetworkError('slow', { timeout: true }))).toBeTrue();
    });

    it('does not retry a GET aborted by the caller', () => {
      const controller = new AbortController();

      controller.abort();

      expect(policy.shouldRetry('GET', new NetworkError('aborted'), controller.signal)).toBeFalse();
    });

    it('retries a GET when the caller signal is not aborted', () => {
      expect(policy.shouldRetry('GET', new NetworkError('down'), new AbortController().signal)).toBeTrue();
    });

    ['POST', 'PATCH', 'DELETE', 'PUT'].forEach((method) => {
      it(`never retries a ${method}`, () => {
        expect(policy.shouldRetry(method, new NetworkError('down'))).toBeFalse();
        expect(policy.shouldRetry(method, apiError(503))).toBeFalse();
        expect(policy.shouldRetry(method, apiError(429))).toBeFalse();
      });
    });

    it('does not retry unknown errors', () => {
      expect(policy.shouldRetry('GET', new TypeError('bug'))).toBeFalse();
      expect(policy.shouldRetry('GET', new ApiError({ status: 503, method: 'GET', path: '/a.json' }))).toBeTrue();
    });
  });

  describe('delay', () => {
    it('backs off exponentially from about 500 ms', () => {
      expect(policy.delay(0)).toEqual(500);
      expect(policy.delay(1)).toEqual(1000);
      expect(policy.delay(2)).toEqual(2000);
    });

    it('applies a +/- 25% jitter', () => {
      random = 0;
      expect(policy.delay(0)).toEqual(375);
      random = 0.999999;
      expect(policy.delay(1)).toEqual(1250);
    });

    it('honors Retry-After in seconds', () => {
      expect(policy.delay(0, '3')).toEqual(3000);
      expect(policy.delay(1, ' 0 ')).toEqual(0);
    });

    it('honors Retry-After as an HTTP date', () => {
      expect(policy.delay(0, 'Sun, 18 Oct 2026 12:00:05 GMT')).toEqual(5000);
    });

    it('does not wait for a Retry-After date in the past', () => {
      expect(policy.delay(0, 'Sun, 18 Oct 2026 11:00:00 GMT')).toEqual(0);
    });

    it('falls back to the backoff for a missing or invalid Retry-After', () => {
      expect(policy.delay(0, null)).toEqual(500);
      expect(policy.delay(0, undefined)).toEqual(500);
      expect(policy.delay(0, '')).toEqual(500);
      expect(policy.delay(0, 'soon')).toEqual(500);
    });

    it('uses Math.random and Date.now by default', () => {
      const delay = new RetryPolicy().delay(0);

      expect(delay).toBeGreaterThanOrEqual(375);
      expect(delay).toBeLessThanOrEqual(625);
    });
  });
});
