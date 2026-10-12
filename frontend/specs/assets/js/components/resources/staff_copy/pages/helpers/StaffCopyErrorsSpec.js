import staffCopyErrorKey from '../../../../../../../../assets/js/components/resources/staff_copy/pages/helpers/StaffCopyErrors.js';

describe('staffCopyErrorKey', function() {
  [
    [404, 'not_found'], [422, 'name_taken'], [400, 'bad_request'], [500, 'unknown'], [undefined, 'unknown'],
  ].forEach(([status, key]) => {
    it(`maps ${status} to ${key}`, function() {
      expect(staffCopyErrorKey(status)).toBe(`staff_copies_page.entity_error.${key}`);
    });
  });
});
