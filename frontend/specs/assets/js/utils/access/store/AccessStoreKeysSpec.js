import AccessStoreKeys from '../../../../../../assets/js/utils/access/store/AccessStoreKeys.js';

describe('AccessStoreKeys', function() {
  describe('#normalizeRoles', function() {
    it('sorts and dedupes the given roles', function() {
      expect(AccessStoreKeys.normalizeRoles(['player', 'dm', 'dm'])).toEqual(['dm', 'player']);
    });

    it('returns an empty array when given none/empty', function() {
      expect(AccessStoreKeys.normalizeRoles()).toEqual([]);
      expect(AccessStoreKeys.normalizeRoles([])).toEqual([]);
    });
  });

  describe('#game', function() {
    it('builds the game identity cache key', function() {
      expect(AccessStoreKeys.game('demo')).toBe('game:demo');
    });
  });

  describe('#character', function() {
    it('builds the character identity cache key', function() {
      expect(AccessStoreKeys.character('pcs', 'demo', '2')).toBe('character:pcs:demo:2');
    });
  });

  describe('#treasure', function() {
    it('builds the treasure identity cache key', function() {
      expect(AccessStoreKeys.treasure(42)).toBe('treasure:42');
    });
  });

  describe('#gamePermissions', function() {
    it('builds the game permissions cache key, scoped by role set', function() {
      expect(AccessStoreKeys.gamePermissions('demo', [])).toBe('permissions:game:demo:');
      expect(AccessStoreKeys.gamePermissions('demo', ['dm', 'player'])).toBe('permissions:game:demo:dm,player');
    });
  });

  describe('#characterPermissions', function() {
    it('builds the character permissions cache key, scoped by role set', function() {
      expect(AccessStoreKeys.characterPermissions('pcs', 'demo', '2', ['owner']))
        .toBe('permissions:character:pcs:demo:2:owner');
    });
  });

  describe('#treasurePermissions', function() {
    it('builds the treasure permissions cache key, scoped by role set', function() {
      expect(AccessStoreKeys.treasurePermissions(42, ['superuser'])).toBe('permissions:treasure:42:superuser');
    });
  });
});
