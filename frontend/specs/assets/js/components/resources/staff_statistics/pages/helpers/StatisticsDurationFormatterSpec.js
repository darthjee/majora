import StatisticsDurationFormatter from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsDurationFormatter.js';

describe('StatisticsDurationFormatter', function() {
  describe('.format', function() {
    it('returns a dash for null', function() {
      expect(StatisticsDurationFormatter.format(null)).toBe('—');
    });

    it('returns a dash for undefined', function() {
      expect(StatisticsDurationFormatter.format(undefined)).toBe('—');
    });

    it('formats zero as minutes and seconds', function() {
      expect(StatisticsDurationFormatter.format(0)).toBe('0m 0s');
    });

    it('formats a duration below one hour as minutes and seconds', function() {
      expect(StatisticsDurationFormatter.format(274)).toBe('4m 34s');
    });

    it('formats one second below the hour as minutes and seconds', function() {
      expect(StatisticsDurationFormatter.format(3599)).toBe('59m 59s');
    });

    it('formats exactly one hour as hours and minutes', function() {
      expect(StatisticsDurationFormatter.format(3600)).toBe('1h 0m');
    });

    it('formats a duration above one hour dropping the seconds', function() {
      expect(StatisticsDurationFormatter.format(5430)).toBe('1h 30m');
    });

    it('drops leftover seconds in the hour form', function() {
      expect(StatisticsDurationFormatter.format(3661)).toBe('1h 1m');
    });
  });
});
