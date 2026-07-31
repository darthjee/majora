import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';

describe('AccessStoreFacade', function() {
  afterEach(function() {
    AccessStoreFacade.clear();
  });

  describe('#get', function() {
    it('returns disabled/empty by default', function() {
      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], notLogged: false, gameSlug: null });
    });

    it('returns the state set by #set', function() {
      AccessStoreFacade.set(true, ['dm', 'owner']);

      expect(AccessStoreFacade.get()).toEqual({
        enabled: true, roles: ['dm', 'owner'], notLogged: false, gameSlug: null,
      });
    });

    it('returns the notLogged flag set by #set', function() {
      AccessStoreFacade.set(true, [], true);

      expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: [], notLogged: true, gameSlug: null });
    });

    it('returns the gameSlug set by #set', function() {
      AccessStoreFacade.set(true, ['dm'], false, 'epic-quest');

      expect(AccessStoreFacade.get()).toEqual({
        enabled: true, roles: ['dm'], notLogged: false, gameSlug: 'epic-quest',
      });
    });
  });

  describe('#set', function() {
    it('deduplicates roles', function() {
      AccessStoreFacade.set(true, ['dm', 'dm', 'owner']);

      expect(AccessStoreFacade.get().roles.sort()).toEqual(['dm', 'owner']);
    });

    it('defaults notLogged to false when not given', function() {
      AccessStoreFacade.set(true, ['dm']);

      expect(AccessStoreFacade.get().notLogged).toBe(false);
    });

    it('defaults gameSlug to null when not given', function() {
      AccessStoreFacade.set(true, ['dm']);

      expect(AccessStoreFacade.get().gameSlug).toBeNull();
    });
  });

  describe('#clear', function() {
    it('resets the facade back to disabled/empty', function() {
      AccessStoreFacade.set(true, ['dm'], true, 'epic-quest');

      AccessStoreFacade.clear();

      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], notLogged: false, gameSlug: null });
    });
  });

  describe('#syncRoute', function() {
    it('does nothing and returns false when the facade has no stored gameSlug', function() {
      AccessStoreFacade.set(true, ['dm']);

      const cleared = AccessStoreFacade.syncRoute('other-game');

      expect(cleared).toBe(false);
      expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm'], notLogged: false, gameSlug: null });
    });

    it('keeps the facade when the current gameSlug matches the stored one', function() {
      AccessStoreFacade.set(true, ['dm'], false, 'epic-quest');

      const cleared = AccessStoreFacade.syncRoute('epic-quest');

      expect(cleared).toBe(false);
      expect(AccessStoreFacade.get()).toEqual({
        enabled: true, roles: ['dm'], notLogged: false, gameSlug: 'epic-quest',
      });
    });

    it('clears the facade when navigating to a different game', function() {
      AccessStoreFacade.set(true, ['dm'], false, 'epic-quest');

      const cleared = AccessStoreFacade.syncRoute('other-game');

      expect(cleared).toBe(true);
      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], notLogged: false, gameSlug: null });
    });

    it('clears the facade when navigating away from any game page', function() {
      AccessStoreFacade.set(true, ['dm'], false, 'epic-quest');

      const cleared = AccessStoreFacade.syncRoute(undefined);

      expect(cleared).toBe(true);
      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], notLogged: false, gameSlug: null });
    });
  });

  describe('#rolesForPermissionsRequest', function() {
    it('returns the caller-supplied real roles unchanged when the facade is disabled', function() {
      AccessStoreFacade.clear();

      expect(AccessStoreFacade.rolesForPermissionsRequest(['player', 'logged'])).toEqual(['player', 'logged']);
    });

    it('returns an empty array when the facade is enabled with "Not Logged" on', function() {
      AccessStoreFacade.set(true, ['dm'], true);

      expect(AccessStoreFacade.rolesForPermissionsRequest(['player', 'logged'])).toEqual([]);
    });

    it('returns the facade roles plus "logged" when enabled without "Not Logged"', function() {
      AccessStoreFacade.set(true, ['dm']);

      expect(AccessStoreFacade.rolesForPermissionsRequest(['player'])).toEqual(['dm', 'logged']);
    });

    it('returns just ["logged"] when the facade is enabled with no roles picked', function() {
      AccessStoreFacade.set(true, []);

      expect(AccessStoreFacade.rolesForPermissionsRequest(['player'])).toEqual(['logged']);
    });
  });
});
