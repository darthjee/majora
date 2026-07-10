import AccessStore from '../../../../assets/js/utils/AccessStore.js';
import AccessEvents from '../../../../assets/js/utils/AccessEvents.js';
import GameClient from '../../../../assets/js/client/GameClient.js';
import CharacterClient from '../../../../assets/js/client/CharacterClient.js';
import TreasureClient from '../../../../assets/js/client/TreasureClient.js';
import AuthClient from '../../../../assets/js/client/AuthClient.js';

/**
 * @description Builds a fake `Response`-shaped object for mocking the access endpoints.
 * @param {object} body - JSON body the mocked response resolves to.
 * @param {boolean} [ok] - Whether the response is "ok".
 * @returns {{ok: boolean, json: Function}} A fake Response object.
 */
function fakeResponse(body, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
  });

  afterEach(function() {
    AccessStore.reset();
  });

  describe('#ensureGameAccess', function() {
    it('resolves with the fetched access payload and emits an event', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );
      spyOn(AccessEvents, 'emit');

      const result = await AccessStore.ensureGameAccess('demo');

      expect(result).toEqual({ can_edit: true });
      expect(AccessEvents.emit).toHaveBeenCalledWith({ key: 'game:demo' });
    });

    it('caches the ready result and does not refetch', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      await AccessStore.ensureGameAccess('demo');
      await AccessStore.ensureGameAccess('demo');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('dedupes concurrent calls into a single request', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const [first, second] = await Promise.all([
        AccessStore.ensureGameAccess('demo'),
        AccessStore.ensureGameAccess('demo'),
      ]);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(first).toEqual({ can_edit: true });
      expect(second).toEqual({ can_edit: true });
    });

    it('resolves with the fail-closed default when the response is not ok', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse(null, false)),
      );

      const result = await AccessStore.ensureGameAccess('demo');

      expect(result).toEqual({ can_edit: false });
    });

    it('resolves with the fail-closed default when the request throws', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.reject(new Error('network error')),
      );

      const result = await AccessStore.ensureGameAccess('demo');

      expect(result).toEqual({ can_edit: false });
    });

    it('does not cache a fail-closed result and refetches after an abort', async function() {
      let rejectPending;
      const pending = new Promise((resolve, reject) => {
        rejectPending = reject;
      });

      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.callFake((slug, token, signal) => {
        signal.addEventListener('abort', () => {
          rejectPending(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
        return pending;
      });

      const first = AccessStore.ensureGameAccess('demo');
      AccessStore.reset();
      await first;

      fetchSpy.and.returnValue(Promise.resolve(fakeResponse({ can_edit: true })));
      const second = await AccessStore.ensureGameAccess('demo');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(second).toEqual({ can_edit: true });
    });
  });

  describe('#ensureCharacterAccess', function() {
    it('resolves with the fetched access payload, keyed by kind/game/character', async function() {
      spyOn(CharacterClient.prototype, 'fetchCharacterAccess').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureCharacterAccess('pcs', 'demo', '2');

      expect(result).toEqual({ can_edit: true });
      expect(AccessStore.getCharacterAccess('pcs', 'demo', '2')).toEqual({ can_edit: true });
      expect(AccessStore.getCharacterAccess('npcs', 'demo', '2')).toEqual({ can_edit: false });
    });
  });

  describe('#ensureTreasureAccess', function() {
    it('resolves with the fetched access payload', async function() {
      spyOn(TreasureClient.prototype, 'fetchTreasureAccess').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureTreasureAccess(42);

      expect(result).toEqual({ can_edit: true });
      expect(AccessStore.getTreasureAccess(42)).toEqual({ can_edit: true });
    });
  });

  describe('#ensureSuperUser', function() {
    it('resolves to true when the status response reports a superuser', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: true })),
      );

      const result = await AccessStore.ensureSuperUser();

      expect(result).toBe(true);
      expect(AccessStore.isSuperUser()).toBe(true);
    });

    it('resolves to false when the response is not ok', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(Promise.resolve(fakeResponse(null, false)));

      const result = await AccessStore.ensureSuperUser();

      expect(result).toBe(false);
    });

    it('resolves to false when the request throws', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(Promise.reject(new Error('network error')));

      const result = await AccessStore.ensureSuperUser();

      expect(result).toBe(false);
    });
  });

  describe('#ensureStaffOrSuperUser', function() {
    it('resolves to true when the status response reports a staff member', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: false, is_staff: true })),
      );

      const result = await AccessStore.ensureStaffOrSuperUser();

      expect(result).toBe(true);
      expect(AccessStore.isStaffOrSuperUser()).toBe(true);
    });

    it('resolves to false when neither flag is set', async function() {
      spyOn(AuthClient.prototype, 'status').and.returnValue(
        Promise.resolve(fakeResponse({ is_superuser: false, is_staff: false })),
      );

      const result = await AccessStore.ensureStaffOrSuperUser();

      expect(result).toBe(false);
    });
  });

  describe('synchronous getters', function() {
    it('return the fail-closed default while a request is pending', async function() {
      let resolvePending;
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        new Promise((resolve) => {
          resolvePending = resolve;
        }),
      );

      const promise = AccessStore.ensureGameAccess('demo');

      expect(AccessStore.getGameAccess('demo')).toEqual({ can_edit: false });

      resolvePending(fakeResponse({ can_edit: true }));
      await promise;

      expect(AccessStore.getGameAccess('demo')).toEqual({ can_edit: true });
    });

    it('return the fail-closed default for an unrequested key', function() {
      expect(AccessStore.getGameAccess('unknown')).toEqual({ can_edit: false });
      expect(AccessStore.getTreasureAccess(1)).toEqual({ can_edit: false });
      expect(AccessStore.isSuperUser()).toBe(false);
      expect(AccessStore.isStaffOrSuperUser()).toBe(false);
    });
  });

  describe('#syncForRoute', function() {
    it('resets cached state and requests the game access for a game page', function() {
      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('game', '#/games/demo');

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
    });

    it('requests character access for a character page', function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('pcCharacter', '#/games/demo/pcs/2');

      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith('pcs', 'demo', '2');
    });

    it('requests both the superuser and treasure access for the treasure edit page', function() {
      spyOn(AccessStore, 'ensureSuperUser').and.returnValue(Promise.resolve(true));
      spyOn(AccessStore, 'ensureTreasureAccess').and.returnValue(Promise.resolve({ can_edit: false }));

      AccessStore.syncForRoute('treasureEdit', '#/treasures/42/edit');

      expect(AccessStore.ensureSuperUser).toHaveBeenCalled();
      expect(AccessStore.ensureTreasureAccess).toHaveBeenCalledWith('42');
    });

    it('requests staffOrSuperuser access for a staff page', function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));

      AccessStore.syncForRoute('staffUsers', '#/staff/users');

      expect(AccessStore.ensureStaffOrSuperUser).toHaveBeenCalled();
    });

    it('is a no-op besides resetting for a page with no access check', function() {
      expect(() => AccessStore.syncForRoute('home', '#/')).not.toThrow();
    });

    it('clears any previously cached entry', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      await AccessStore.ensureGameAccess('demo');
      expect(AccessStore.getGameAccess('demo')).toEqual({ can_edit: true });

      AccessStore.syncForRoute('home', '#/');

      expect(AccessStore.getGameAccess('demo')).toEqual({ can_edit: false });
    });
  });

  describe('#syncForAuthChange', function() {
    it('aborts in-flight requests, clears the cache, and re-syncs the last route', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      AccessStore.syncForRoute('game', '#/games/demo');
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      AccessStore.syncForAuthChange();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
