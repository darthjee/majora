import StatisticsDateTimeFormatter
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDateTimeFormatter.js';

describe('StatisticsDateTimeFormatter', function() {
  describe('.format', function() {
    it('formats a timestamp as date and time', function() {
      const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        .format(new Date('2026-01-07T10:00:00Z'));

      expect(StatisticsDateTimeFormatter.format('2026-01-07T10:00:00Z')).toBe(expected);
    });

    it('renders a dash when missing', function() {
      expect(StatisticsDateTimeFormatter.format(null)).toBe('—');
      expect(StatisticsDateTimeFormatter.format(undefined)).toBe('—');
    });
  });
});
