import ApiTokenExpiry from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenExpiry.js';

describe('ApiTokenExpiry', function() {
  const now = new Date('2026-03-10T12:00:00Z');

  it('defaults to 90 days', function() {
    expect(ApiTokenExpiry.DEFAULT).toEqual({ choice: '90', customDate: '' });
    expect(ApiTokenExpiry.CHOICES).toEqual(['30', '90', 'custom', 'never']);
  });

  describe('.toExpiresAt', function() {
    it('adds 30 days for the 30 preset', function() {
      expect(ApiTokenExpiry.toExpiresAt({ choice: '30' }, now)).toBe('2026-04-09T12:00:00.000Z');
    });

    it('adds 90 days for the 90 preset', function() {
      expect(ApiTokenExpiry.toExpiresAt({ choice: '90' }, now)).toBe('2026-06-08T12:00:00.000Z');
    });

    it('uses the end of the custom day in local time', function() {
      const expected = new Date(2026, 3, 15, 23, 59, 59, 999).toISOString();

      expect(ApiTokenExpiry.toExpiresAt({ choice: 'custom', customDate: '2026-04-15' }, now)).toBe(expected);
    });

    it('returns null for an empty custom date', function() {
      expect(ApiTokenExpiry.toExpiresAt({ choice: 'custom', customDate: '' }, now)).toBeNull();
    });

    it('returns null for never', function() {
      expect(ApiTokenExpiry.toExpiresAt({ choice: 'never' }, now)).toBeNull();
    });

    it('defaults now to the current time', function() {
      const before = Date.now();
      const result = Date.parse(ApiTokenExpiry.toExpiresAt({ choice: '30' }));

      expect(result).toBeGreaterThanOrEqual(before + 30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('.minDate', function() {
    it('returns tomorrow in local time', function() {
      expect(ApiTokenExpiry.minDate(new Date(2026, 11, 31, 22, 0))).toBe('2027-01-01');
      expect(ApiTokenExpiry.minDate(new Date(2026, 1, 3, 0, 5))).toBe('2026-02-04');
    });

    it('defaults now to the current time', function() {
      expect(ApiTokenExpiry.minDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
