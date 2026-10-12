import staffCopyErrorKey, { staffCopyLinkErrorKey } from '../../../../../../../../assets/js/components/resources/staff_copy/pages/helpers/StaffCopyErrors.js';

describe('staffCopyErrorKey', function() {
  [
    [404, 'not_found'], [422, 'name_taken'], [400, 'bad_request'], [500, 'unknown'], [undefined, 'unknown'],
  ].forEach(([status, key]) => {
    it(`maps ${status} to ${key}`, function() {
      expect(staffCopyErrorKey(status)).toBe(`staff_copies_page.entity_error.${key}`);
    });
  });
});

describe('staffCopyLinkErrorKey', function() {
  ['source_missing', 'path_rejected', 'cross_device', 'target_exists', 'permission'].forEach((code) => {
    it(`maps ${code} to its key`, function() {
      expect(staffCopyLinkErrorKey(code)).toBe(`staff_copies_page.link_error.${code}`);
    });
  });

  it('maps unknown and missing codes to unknown', function() {
    expect(staffCopyLinkErrorKey('weird')).toBe('staff_copies_page.link_error.unknown');
    expect(staffCopyLinkErrorKey(null)).toBe('staff_copies_page.link_error.unknown');
  });
});
