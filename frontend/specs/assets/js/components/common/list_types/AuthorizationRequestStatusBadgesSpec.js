import AuthorizationRequestStatusBadges from '../../../../../../assets/js/components/common/list_types/AuthorizationRequestStatusBadges.js';

describe('AuthorizationRequestStatusBadges', function() {
  describe('.build', function() {
    it('builds the open badge', function() {
      expect(AuthorizationRequestStatusBadges.build('open')).toEqual({ variant: 'success', text: 'Open' });
    });

    it('builds the approved badge', function() {
      expect(AuthorizationRequestStatusBadges.build('approved')).toEqual({ variant: 'primary', text: 'Approved' });
    });

    it('builds the logged badge with the custom darker-blue variant', function() {
      expect(AuthorizationRequestStatusBadges.build('logged'))
        .toEqual({ variant: 'authorization-logged', text: 'Logged' });
    });

    it('builds the denied badge', function() {
      expect(AuthorizationRequestStatusBadges.build('denied')).toEqual({ variant: 'danger', text: 'Denied' });
    });

    it('builds the expired badge', function() {
      expect(AuthorizationRequestStatusBadges.build('expired')).toEqual({ variant: 'secondary', text: 'Expired' });
    });

    it('falls back to the secondary variant for an unrecognized status', function() {
      expect(AuthorizationRequestStatusBadges.build('unknown').variant).toBe('secondary');
    });
  });
});
