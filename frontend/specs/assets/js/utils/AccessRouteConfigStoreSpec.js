import AccessRouteConfigStore from '../../../../assets/js/utils/AccessRouteConfigStore.js';
import AccessRouteConfigClient from '../../../../assets/js/client/AccessRouteConfigClient.js';

/**
 * @description Builds a fake `Response`-shaped object for mocking the config endpoint.
 * @param {object} body - JSON body the mocked response resolves to.
 * @param {boolean} [ok] - Whether the response is "ok".
 * @returns {{ok: boolean, json: Function}} A fake Response object.
 */
function fakeResponse(body, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('AccessRouteConfigStore', function() {
  afterEach(function() {
    AccessRouteConfigStore.reset();
  });

  describe('#getKind', function() {
    it('returns the fallback kind before the config has loaded', function() {
      expect(AccessRouteConfigStore.getKind('game')).toEqual({ kind: 'game' });
      expect(AccessRouteConfigStore.getKind('pcCharacter')).toEqual({ kind: 'character', characterKind: 'pcs' });
    });

    it('returns undefined for a page with no resource-kind mapping', function() {
      expect(AccessRouteConfigStore.getKind('home')).toBeUndefined();
    });
  });

  describe('#load', function() {
    it('merges the fetched config over the fallback kinds', async function() {
      spyOn(AccessRouteConfigClient.prototype, 'fetchAccessRouteConfig').and.returnValue(
        Promise.resolve(fakeResponse({ game: { kind: 'superuser' } })),
      );

      await AccessRouteConfigStore.load();

      expect(AccessRouteConfigStore.getKind('game')).toEqual({ kind: 'superuser' });
      expect(AccessRouteConfigStore.getKind('pcCharacter')).toEqual({ kind: 'character', characterKind: 'pcs' });
    });

    it('is idempotent: a second call does not refetch', async function() {
      const fetchSpy = spyOn(AccessRouteConfigClient.prototype, 'fetchAccessRouteConfig').and.returnValue(
        Promise.resolve(fakeResponse({})),
      );

      await AccessRouteConfigStore.load();
      await AccessRouteConfigStore.load();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps the fallback kinds when the response is not ok', async function() {
      spyOn(AccessRouteConfigClient.prototype, 'fetchAccessRouteConfig').and.returnValue(
        Promise.resolve(fakeResponse(null, false)),
      );

      await AccessRouteConfigStore.load();

      expect(AccessRouteConfigStore.getKind('game')).toEqual({ kind: 'game' });
    });

    it('keeps the fallback kinds when the request throws', async function() {
      spyOn(AccessRouteConfigClient.prototype, 'fetchAccessRouteConfig').and.returnValue(
        Promise.reject(new Error('network error')),
      );

      await AccessRouteConfigStore.load();

      expect(AccessRouteConfigStore.getKind('game')).toEqual({ kind: 'game' });
    });
  });

  describe('#reset', function() {
    it('discards a loaded config and any in-flight fetch, restoring the fallback', async function() {
      spyOn(AccessRouteConfigClient.prototype, 'fetchAccessRouteConfig').and.returnValue(
        Promise.resolve(fakeResponse({ game: { kind: 'superuser' } })),
      );

      await AccessRouteConfigStore.load();
      expect(AccessRouteConfigStore.getKind('game')).toEqual({ kind: 'superuser' });

      AccessRouteConfigStore.reset();

      expect(AccessRouteConfigStore.getKind('game')).toEqual({ kind: 'game' });
    });
  });
});
