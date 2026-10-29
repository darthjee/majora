import ApiTokenScopes from '../../../../../../assets/js/components/common/api_tokens/ApiTokenScopes.js';

describe('ApiTokenScopes', function() {
  describe('.GROUPS', function() {
    it('lists the 17 families in 6 groups, with statistics last', function() {
      const groups = ApiTokenScopes.GROUPS.map(({ group }) => group);
      const families = ApiTokenScopes.GROUPS.flatMap(({ families: list }) => list);

      expect(groups).toEqual(['game', 'characters', 'documents', 'inventory', 'miniatures', 'statistics']);
      expect(families.length).toBe(17);
      expect(ApiTokenScopes.GROUPS.at(-1)).toEqual({ group: 'statistics', families: ['statistics'] });
    });
  });

  describe('.EXPLICIT_ONLY / .isExplicitOnly', function() {
    it('lists statistics:read as explicit-only', function() {
      expect(ApiTokenScopes.EXPLICIT_ONLY).toEqual(['statistics:read']);
      expect(ApiTokenScopes.isExplicitOnly('statistics:read')).toBeTrue();
      expect(ApiTokenScopes.isExplicitOnly('npcs:read')).toBeFalse();
    });
  });

  describe('.familyOf / .actionOf', function() {
    it('splits a scope string', function() {
      expect(ApiTokenScopes.familyOf('common_items:write')).toBe('common_items');
      expect(ApiTokenScopes.actionOf('common_items:write')).toBe('write');
    });
  });

  describe('.groupScopes', function() {
    it('returns groups and families in display order, regardless of input order', function() {
      const result = ApiTokenScopes.groupScopes(['miniatures:read', 'npcs:write', 'games:read', 'npcs:read']);

      expect(result).toEqual([
        { group: 'game', families: [{ family: 'games', read: true, write: false }] },
        { group: 'characters', families: [{ family: 'npcs', read: true, write: true }] },
        { group: 'miniatures', families: [{ family: 'miniatures', read: true, write: false }] },
      ]);
    });

    it('drops families unknown to the UI constant', function() {
      expect(ApiTokenScopes.groupScopes(['spells:read', 'spells:write'])).toEqual([]);
    });

    it('flags write-only families', function() {
      expect(ApiTokenScopes.groupScopes(['documents:write'])).toEqual([
        { group: 'documents', families: [{ family: 'documents', read: false, write: true }] },
      ]);
    });

    it('returns the read-only statistics group last', function() {
      const result = ApiTokenScopes.groupScopes(['statistics:read', 'miniatures:read', 'games:read']);

      expect(result.map(({ group }) => group)).toEqual(['game', 'miniatures', 'statistics']);
      expect(result.at(-1)).toEqual({
        group: 'statistics', families: [{ family: 'statistics', read: true, write: false }],
      });
    });

    it('returns an empty list for no scopes', function() {
      expect(ApiTokenScopes.groupScopes([])).toEqual([]);
    });
  });
});
