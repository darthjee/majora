import ApiTokenStatusBadges
  from '../../../../../../assets/js/components/common/list_types/ApiTokenStatusBadges.js';

describe('ApiTokenStatusBadges', function() {
  describe('.build', function() {
    it('maps active to a success badge', function() {
      expect(ApiTokenStatusBadges.build({ status: 'active' })).toEqual({ variant: 'success', text: 'Active' });
    });

    it('maps expired to a secondary badge', function() {
      expect(ApiTokenStatusBadges.build({ status: 'expired' })).toEqual({ variant: 'secondary', text: 'Expired' });
    });

    it('does not recompute the status from expires_at', function() {
      const past = new Date(Date.now() - 1000).toISOString();

      expect(ApiTokenStatusBadges.build({ status: 'active', expires_at: past }).variant).toBe('success');
    });
  });
});
