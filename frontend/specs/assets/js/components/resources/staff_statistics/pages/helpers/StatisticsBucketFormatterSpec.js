import StatisticsBucketFormatter from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js';

describe('StatisticsBucketFormatter', function() {
  const locale = 'en-GB';

  describe('.label', function() {
    it('labels a day bucket with day and month', function() {
      expect(StatisticsBucketFormatter.label('2026-01-05', 'day', locale)).toBe('5 Jan');
    });

    it('labels a week bucket by its (clipped) start', function() {
      expect(StatisticsBucketFormatter.label('2026-01-01', 'week', locale)).toBe('1 Jan');
    });

    it('labels a month bucket with month and year', function() {
      expect(StatisticsBucketFormatter.label('2026-01-01', 'month', locale)).toBe('Jan 2026');
    });

    it('does not shift the date by the time zone', function() {
      expect(StatisticsBucketFormatter.label('2026-03-01', 'day', locale)).toBe('1 Mar');
    });

    it('uses the US order for en-US', function() {
      expect(StatisticsBucketFormatter.label('2026-01-05', 'day', 'en-US')).toBe('Jan 5');
    });
  });

  describe('.range', function() {
    it('returns a single date for a single-day bucket', function() {
      expect(StatisticsBucketFormatter.range('2026-01-05', '2026-01-05', locale)).toBe('5 Jan 2026');
    });

    it('returns both ends for a multi-day bucket', function() {
      expect(StatisticsBucketFormatter.range('2026-01-05', '2026-01-11', locale))
        .toBe('5 Jan 2026 – 11 Jan 2026');
    });

    it('formats a clipped first bucket', function() {
      expect(StatisticsBucketFormatter.range('2026-01-01', '2026-01-04', locale))
        .toBe('1 Jan 2026 – 4 Jan 2026');
    });

    it('formats a clipped last bucket', function() {
      expect(StatisticsBucketFormatter.range('2026-03-30', '2026-03-31', locale))
        .toBe('30 Mar 2026 – 31 Mar 2026');
    });

    it('spans a year boundary', function() {
      expect(StatisticsBucketFormatter.range('2025-12-29', '2026-01-04', locale))
        .toBe('29 Dec 2025 – 4 Jan 2026');
    });
  });

  describe('.count', function() {
    it('formats thousands separators', function() {
      expect(StatisticsBucketFormatter.count(1234567, locale)).toBe('1,234,567');
    });

    it('formats zero', function() {
      expect(StatisticsBucketFormatter.count(0, locale)).toBe('0');
    });
  });

  describe('.percent', function() {
    it('formats zero', function() {
      expect(StatisticsBucketFormatter.percent(0, locale)).toBe('0%');
    });

    it('rounds a fraction to a whole percentage', function() {
      expect(StatisticsBucketFormatter.percent(0.4286, locale)).toBe('43%');
    });

    it('formats one', function() {
      expect(StatisticsBucketFormatter.percent(1, locale)).toBe('100%');
    });
  });
});
