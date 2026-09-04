import RecoveryTokenStatusBadges
  from '../../../../../../assets/js/components/common/list_types/RecoveryTokenStatusBadges.js';

describe('RecoveryTokenStatusBadges', function() {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  describe('.computeStatus', function() {
    it('returns used when used_at is set', function() {
      expect(RecoveryTokenStatusBadges.computeStatus({
        used_at: past, invalidated_at: null, expires_at: future,
      })).toBe('used');
    });

    it('returns revoked when invalidated_at is set', function() {
      expect(RecoveryTokenStatusBadges.computeStatus({
        used_at: null, invalidated_at: past, expires_at: future,
      })).toBe('revoked');
    });

    it('returns expired when expires_at is in the past', function() {
      expect(RecoveryTokenStatusBadges.computeStatus({
        used_at: null, invalidated_at: null, expires_at: past,
      })).toBe('expired');
    });

    it('returns valid otherwise', function() {
      expect(RecoveryTokenStatusBadges.computeStatus({
        used_at: null, invalidated_at: null, expires_at: future,
      })).toBe('valid');
    });

    it('prefers used over revoked when both used_at and invalidated_at are set', function() {
      expect(RecoveryTokenStatusBadges.computeStatus({
        used_at: past, invalidated_at: past, expires_at: future,
      })).toBe('used');
    });

    it('prefers revoked over expired when invalidated_at is set on an already-expired token', function() {
      expect(RecoveryTokenStatusBadges.computeStatus({
        used_at: null, invalidated_at: past, expires_at: past,
      })).toBe('revoked');
    });
  });

  describe('.build', function() {
    it('builds the used badge', function() {
      expect(RecoveryTokenStatusBadges.build({
        used_at: past, invalidated_at: null, expires_at: future,
      })).toEqual({ variant: 'secondary', text: 'Used' });
    });

    it('builds the revoked badge', function() {
      expect(RecoveryTokenStatusBadges.build({
        used_at: null, invalidated_at: past, expires_at: future,
      })).toEqual({ variant: 'danger', text: 'Revoked' });
    });

    it('builds the expired badge', function() {
      expect(RecoveryTokenStatusBadges.build({
        used_at: null, invalidated_at: null, expires_at: past,
      })).toEqual({ variant: 'warning', text: 'Expired' });
    });

    it('builds the valid badge', function() {
      expect(RecoveryTokenStatusBadges.build({
        used_at: null, invalidated_at: null, expires_at: future,
      })).toEqual({ variant: 'success', text: 'Valid' });
    });
  });
});
