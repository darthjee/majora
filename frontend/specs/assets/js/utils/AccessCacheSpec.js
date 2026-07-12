import AccessCache from '../../../../assets/js/utils/AccessCache.js';
import AccessEvents from '../../../../assets/js/utils/AccessEvents.js';
import Noop from '../../../../assets/js/utils/Noop.js';

describe('AccessCache', function() {
  let cache;

  beforeEach(function() {
    cache = new AccessCache();
  });

  describe('#ensure', function() {
    it('resolves with the fetched value and emits an event', async function() {
      spyOn(AccessEvents, 'emit');

      const result = await cache.ensure('key', () => Promise.resolve('value'), 'default');

      expect(result).toBe('value');
      expect(AccessEvents.emit).toHaveBeenCalledWith({ key: 'key' });
    });

    it('caches the ready result and does not refetch', async function() {
      const fetcher = jasmine.createSpy('fetcher').and.returnValue(Promise.resolve('value'));

      await cache.ensure('key', fetcher, 'default');
      await cache.ensure('key', fetcher, 'default');

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('dedupes concurrent calls into a single request', async function() {
      const fetcher = jasmine.createSpy('fetcher').and.returnValue(Promise.resolve('value'));

      const [first, second] = await Promise.all([
        cache.ensure('key', fetcher, 'default'),
        cache.ensure('key', fetcher, 'default'),
      ]);

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(first).toBe('value');
      expect(second).toBe('value');
    });

    it('resolves with the default value, without caching, when the fetcher rejects', async function() {
      spyOn(AccessEvents, 'emit');
      const fetcher = jasmine.createSpy('fetcher').and.returnValue(Promise.reject(new Error('network error')));

      const result = await cache.ensure('key', fetcher, 'default');

      expect(result).toBe('default');
      expect(AccessEvents.emit).toHaveBeenCalledWith({ key: 'key' });
      expect(cache.read('key', 'other-default')).toBe('default');
    });

    it('does not cache a fail-closed result and refetches after an abort', async function() {
      let rejectPending;
      const pending = new Promise((resolve, reject) => {
        rejectPending = reject;
      });
      const fetcher = jasmine.createSpy('fetcher').and.callFake((signal) => {
        signal.addEventListener('abort', () => {
          rejectPending(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
        return pending;
      });

      const first = cache.ensure('key', fetcher, 'default');
      cache.reset();
      await first;

      fetcher.and.returnValue(Promise.resolve('value'));
      const second = await cache.ensure('key', fetcher, 'default');

      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(second).toBe('value');
    });
  });

  describe('#read', function() {
    it('returns the default value for an unrequested key', function() {
      expect(cache.read('unknown', 'default')).toBe('default');
    });

    it('returns the default value while a request is pending', async function() {
      let resolvePending;
      const pending = new Promise((resolve) => {
        resolvePending = resolve;
      });

      const promise = cache.ensure('key', () => pending, 'default');

      expect(cache.read('key', 'default')).toBe('default');

      resolvePending('value');
      await promise;

      expect(cache.read('key', 'default')).toBe('value');
    });
  });

  describe('#reset', function() {
    it('aborts in-flight requests and clears cached entries', function() {
      let aborted = false;
      const fetcher = jasmine.createSpy('fetcher').and.callFake((signal) => {
        signal.addEventListener('abort', () => {
          aborted = true;
        });
        return new Promise(Noop.noop);
      });

      cache.ensure('key', fetcher, 'default');
      cache.reset();

      expect(aborted).toBe(true);
      expect(cache.read('key', 'default')).toBe('default');
    });
  });
});
