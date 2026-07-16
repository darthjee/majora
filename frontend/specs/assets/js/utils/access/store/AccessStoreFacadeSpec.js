import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';

describe('AccessStoreFacade', function() {
  afterEach(function() {
    AccessStoreFacade.clear();
  });

  describe('#get', function() {
    it('returns disabled/empty by default', function() {
      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], gameSlug: null });
    });

    it('returns the state set by #set', function() {
      AccessStoreFacade.set(true, ['dm', 'owner']);

      expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm', 'owner'], gameSlug: null });
    });

    it('returns the gameSlug set by #set', function() {
      AccessStoreFacade.set(true, ['dm'], 'epic-quest');

      expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm'], gameSlug: 'epic-quest' });
    });
  });

  describe('#set', function() {
    it('deduplicates roles', function() {
      AccessStoreFacade.set(true, ['dm', 'dm', 'owner']);

      expect(AccessStoreFacade.get().roles.sort()).toEqual(['dm', 'owner']);
    });

    it('defaults gameSlug to null when not given', function() {
      AccessStoreFacade.set(true, ['dm']);

      expect(AccessStoreFacade.get().gameSlug).toBeNull();
    });
  });

  describe('#clear', function() {
    it('resets the facade back to disabled/empty', function() {
      AccessStoreFacade.set(true, ['dm'], 'epic-quest');

      AccessStoreFacade.clear();

      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], gameSlug: null });
    });
  });

  describe('#syncRoute', function() {
    it('does nothing and returns false when the facade has no stored gameSlug', function() {
      AccessStoreFacade.set(true, ['dm']);

      const cleared = AccessStoreFacade.syncRoute('other-game');

      expect(cleared).toBe(false);
      expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm'], gameSlug: null });
    });

    it('keeps the facade when the current gameSlug matches the stored one', function() {
      AccessStoreFacade.set(true, ['dm'], 'epic-quest');

      const cleared = AccessStoreFacade.syncRoute('epic-quest');

      expect(cleared).toBe(false);
      expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm'], gameSlug: 'epic-quest' });
    });

    it('clears the facade when navigating to a different game', function() {
      AccessStoreFacade.set(true, ['dm'], 'epic-quest');

      const cleared = AccessStoreFacade.syncRoute('other-game');

      expect(cleared).toBe(true);
      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], gameSlug: null });
    });

    it('clears the facade when navigating away from any game page', function() {
      AccessStoreFacade.set(true, ['dm'], 'epic-quest');

      const cleared = AccessStoreFacade.syncRoute(undefined);

      expect(cleared).toBe(true);
      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [], gameSlug: null });
    });
  });

  describe('#effectiveRoles', function() {
    it('returns the caller-supplied roles when the facade is disabled', function() {
      AccessStoreFacade.clear();

      expect(AccessStoreFacade.effectiveRoles(['player'])).toEqual(['player']);
    });

    it('returns the caller-supplied roles when the facade is enabled but has no roles', function() {
      AccessStoreFacade.set(true, []);

      expect(AccessStoreFacade.effectiveRoles(['player'])).toEqual(['player']);
    });

    it('returns the facade roles when the facade is enabled and non-empty', function() {
      AccessStoreFacade.set(true, ['dm']);

      expect(AccessStoreFacade.effectiveRoles(['player'])).toEqual(['dm']);
    });
  });
});
