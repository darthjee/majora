import staffPhotoErrorKey from '../../../../../../../../assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoErrors.js';

describe('staffPhotoErrorKey', function() {
  const cases = [
    ['replace', 409, 'staff_photos_page.error_replace_in_progress'],
    ['replace', 422, 'staff_photos_page.error_path_missing'],
    ['replace', 404, 'staff_photos_page.error_not_found'],
    ['replace', 500, 'staff_photos_page.error_generic'],
    ['replace', undefined, 'staff_photos_page.error_generic'],
    ['delete', 422, 'staff_photos_page.error_delete_replace_in_progress'],
    ['delete', 404, 'staff_photos_page.error_not_found'],
    ['delete', 409, 'staff_photos_page.error_generic'],
    ['delete', 500, 'staff_photos_page.error_generic'],
    ['unknown', 422, 'staff_photos_page.error_generic'],
  ];

  cases.forEach(([action, status, key]) => {
    it(`maps ${action} ${status} to ${key}`, function() {
      expect(staffPhotoErrorKey(action, status)).toBe(key);
    });
  });
});
