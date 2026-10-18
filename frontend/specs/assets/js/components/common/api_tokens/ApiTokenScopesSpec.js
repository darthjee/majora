import ApiTokenScopes from '../../../../../../assets/js/components/common/api_tokens/ApiTokenScopes.js';

describe('ApiTokenScopes', function() {
  describe('.GROUPS', function() {
    it('lists the 16 families in 5 groups', function() {
      const groups = ApiTokenScopes.GROUPS.map(({ group }) => group);
      const families = ApiTokenScopes.GROUPS.flatMap(({ families: list }) => list);

      expect(groups).toEqual(['game', 'characters', 'documents', 'inventory', 'miniatures']);
      expect(families.length).toBe(16);
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

    it('returns an empty list for no scopes', function() {
      expect(ApiTokenScopes.groupScopes([])).toEqual([]);
    });
  });
});
