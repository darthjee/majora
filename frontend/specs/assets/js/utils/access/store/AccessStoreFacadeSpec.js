import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';

describe('AccessStoreFacade', function() {
  afterEach(function() {
    AccessStoreFacade.clear();
  });

  describe('#get', function() {
    it('returns disabled/empty by default', function() {
      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [] });
    });

    it('returns the state set by #set', function() {
      AccessStoreFacade.set(true, ['dm', 'owner']);

      expect(AccessStoreFacade.get()).toEqual({ enabled: true, roles: ['dm', 'owner'] });
    });
  });

  describe('#set', function() {
    it('deduplicates roles', function() {
      AccessStoreFacade.set(true, ['dm', 'dm', 'owner']);

      expect(AccessStoreFacade.get().roles.sort()).toEqual(['dm', 'owner']);
    });
  });

  describe('#clear', function() {
    it('resets the facade back to disabled/empty', function() {
      AccessStoreFacade.set(true, ['dm']);

      AccessStoreFacade.clear();

      expect(AccessStoreFacade.get()).toEqual({ enabled: false, roles: [] });
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
