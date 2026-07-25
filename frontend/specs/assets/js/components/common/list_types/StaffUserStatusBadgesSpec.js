import StaffUserStatusBadges from '../../../../../../assets/js/components/common/list_types/StaffUserStatusBadges.js';

describe('StaffUserStatusBadges', function() {
  describe('.build', function() {
    it('builds the pending badge', function() {
      expect(StaffUserStatusBadges.build('pending')).toEqual({ variant: 'warning', text: 'Pending' });
    });

    it('builds the approved badge', function() {
      expect(StaffUserStatusBadges.build('approved')).toEqual({ variant: 'success', text: 'Approved' });
    });

    it('builds the denied badge', function() {
      expect(StaffUserStatusBadges.build('denied')).toEqual({ variant: 'danger', text: 'Denied' });
    });

    it('falls back to the secondary variant for an unrecognized status', function() {
      expect(StaffUserStatusBadges.build('unknown').variant).toBe('secondary');
    });
  });
});
