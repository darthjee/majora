import ApiTokenScopeSelection from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenScopeSelection.js';

describe('ApiTokenScopeSelection', function() {
  const available = ['npcs:read', 'npcs:write', 'pcs:read', 'pcs:write', 'games:read'];

  describe('.toggle', function() {
    it('ticks a read scope alone', function() {
      expect(ApiTokenScopeSelection.toggle([], 'npcs:read', true, available)).toEqual(['npcs:read']);
    });

    it('ticks the read scope along with write', function() {
      expect(ApiTokenScopeSelection.toggle([], 'npcs:write', true, available)).toEqual(['npcs:read', 'npcs:write']);
    });

    it('does not duplicate an already-ticked read', function() {
      expect(ApiTokenScopeSelection.toggle(['npcs:read'], 'npcs:write', true, available))
        .toEqual(['npcs:read', 'npcs:write']);
    });

    it('does not tick a read scope missing from the catalogue', function() {
      expect(ApiTokenScopeSelection.toggle([], 'tasks:write', true, ['tasks:write'])).toEqual(['tasks:write']);
    });

    it('lets read be unticked by hand while write stays', function() {
      expect(ApiTokenScopeSelection.toggle(['npcs:read', 'npcs:write'], 'npcs:read', false, available))
        .toEqual(['npcs:write']);
    });

    it('ticks and unticks statistics:read directly', function() {
      const withStatistics = [...available, 'statistics:read'];

      expect(ApiTokenScopeSelection.toggle([], 'statistics:read', true, withStatistics)).toEqual(['statistics:read']);
      expect(ApiTokenScopeSelection.toggle(['statistics:read'], 'statistics:read', false, withStatistics)).toEqual([]);
    });

    it('unticks write only', function() {
      expect(ApiTokenScopeSelection.toggle(['npcs:read', 'npcs:write'], 'npcs:write', false, available))
        .toEqual(['npcs:read']);
    });
  });

  describe('.selectAll', function() {
    it('ticks every read scope, keeping the current selection', function() {
      expect(ApiTokenScopeSelection.selectAll(['pcs:write'], available, 'read'))
        .toEqual(['pcs:write', 'npcs:read', 'pcs:read', 'games:read']);
    });

    it('ticks every write scope along with its read', function() {
      expect(ApiTokenScopeSelection.selectAll([], available, 'write').sort())
        .toEqual(['npcs:read', 'npcs:write', 'pcs:read', 'pcs:write']);
    });

    describe('with the explicit-only statistics scope in the catalogue', function() {
      const withStatistics = [...available, 'statistics:read'];

      it('leaves statistics:read unticked on "Select all read"', function() {
        expect(ApiTokenScopeSelection.selectAll([], withStatistics, 'read'))
          .toEqual(['npcs:read', 'pcs:read', 'games:read']);
      });

      it('leaves statistics:read unticked on "Select all write"', function() {
        expect(ApiTokenScopeSelection.selectAll([], withStatistics, 'write')).not.toContain('statistics:read');
      });

      it('keeps statistics:read ticked when it already was', function() {
        expect(ApiTokenScopeSelection.selectAll(['statistics:read'], withStatistics, 'read'))
          .toEqual(['statistics:read', 'npcs:read', 'pcs:read', 'games:read']);
        expect(ApiTokenScopeSelection.selectAll(['statistics:read'], withStatistics, 'write'))
          .toContain('statistics:read');
      });
    });
  });

  describe('.clear', function() {
    it('returns an empty selection', function() {
      expect(ApiTokenScopeSelection.clear()).toEqual([]);
    });
  });
});
