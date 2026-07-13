import StaffUserEditController
  from '../../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserEditController.js';

describe('StaffUserEditController', function() {
  it('extracts user id from an edit hash', function() {
    expect(StaffUserEditController.getStaffUserIdFromEditHash('#/staff/users/42/edit')).toBe('42');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(StaffUserEditController.getStaffUserIdFromEditHash('#/staff/users/42')).toBe('');
  });
});
