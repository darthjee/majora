import AccessStoreAdmin from '../../../../assets/js/utils/AccessStoreAdmin.js';
import AccessCache from '../../../../assets/js/utils/AccessCache.js';

/**
 * @description Builds a fake `Response`-shaped object for mocking the status endpoint.
 * @param {object} body - JSON body the mocked response resolves to.
 * @param {boolean} [ok] - Whether the response is "ok".
 * @returns {{ok: boolean, json: Function}} A fake Response object.
 */
function fakeResponse(body, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('AccessStoreAdmin', function() {
  let cache;
  let authClient;

  beforeEach(function() {
    cache = new AccessCache();
    authClient = jasmine.createSpyObj('authClient', ['status']);
  });

  describe('#ensureSuperUser', function() {
    it('resolves to true when the status response reports a superuser', async function() {
      authClient.status.and.returnValue(Promise.resolve(fakeResponse({ is_superuser: true })));

      const result = await AccessStoreAdmin.ensureSuperUser(cache, authClient);

      expect(result).toBe(true);
      expect(AccessStoreAdmin.isSuperUser(cache)).toBe(true);
    });

    it('resolves to false when the response is not ok', async function() {
      authClient.status.and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStoreAdmin.ensureSuperUser(cache, authClient);

      expect(result).toBe(false);
    });

    it('resolves to false when the request throws', async function() {
      authClient.status.and.returnValue(Promise.reject(new Error('network error')));

      const result = await AccessStoreAdmin.ensureSuperUser(cache, authClient);

      expect(result).toBe(false);
    });
  });

  describe('#ensureStaffOrSuperUser', function() {
    it('resolves to true when the status response reports a staff member', async function() {
      authClient.status.and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: false, is_staff: true })),
      );

      const result = await AccessStoreAdmin.ensureStaffOrSuperUser(cache, authClient);

      expect(result).toBe(true);
      expect(AccessStoreAdmin.isStaffOrSuperUser(cache)).toBe(true);
    });

    it('resolves to false when neither flag is set', async function() {
      authClient.status.and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: false, is_staff: false })),
      );

      const result = await AccessStoreAdmin.ensureStaffOrSuperUser(cache, authClient);

      expect(result).toBe(false);
    });
  });

  describe('#isSuperUser / #isStaffOrSuperUser', function() {
    it('return the fail-closed default for an unrequested key', function() {
      expect(AccessStoreAdmin.isSuperUser(cache)).toBe(false);
      expect(AccessStoreAdmin.isStaffOrSuperUser(cache)).toBe(false);
    });
  });
});
