import StatisticsFilters, {
  AUDIENCES, DEFAULTS, GRANULARITIES, RANGES, UNKNOWN_DOMAIN,
} from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';

describe('StatisticsFilters', function() {
  const read = (query) => StatisticsFilters.fromParams(new URLSearchParams(query));

  describe('constants', function() {
    it('exposes the enum lists', function() {
      expect(RANGES).toEqual(['7d', '30d', '90d', '12m', 'custom']);
      expect(GRANULARITIES).toEqual(['auto', 'day', 'week', 'month']);
      expect(AUDIENCES).toEqual(['all', 'anonymous', 'logged_in']);
      expect(UNKNOWN_DOMAIN).toBe('unknown');
    });
  });

  describe('.fromParams', function() {
    it('returns the defaults for empty params', function() {
      expect(read('')).toEqual({ ...DEFAULTS });
    });

    it('reads every valid value', function() {
      expect(read('range=7d&granularity=week&user=12&domain=3&audience=logged_in')).toEqual({
        range: '7d', from: null, to: null, granularity: 'week', user: '12', domain: '3', audience: 'logged_in',
      });
    });

    it('reads a valid custom range', function() {
      expect(read('range=custom&from=2026-01-01&to=2026-03-31')).toEqual(jasmine.objectContaining({
        range: 'custom', from: '2026-01-01', to: '2026-03-31',
      }));
    });

    it('accepts a single-day custom range', function() {
      expect(read('range=custom&from=2026-01-01&to=2026-01-01').range).toBe('custom');
    });

    it('ignores from / to for presets', function() {
      expect(read('range=7d&from=2026-01-01&to=2026-03-31')).toEqual(jasmine.objectContaining({
        range: '7d', from: null, to: null,
      }));
    });

    it('falls back to 30d for an unknown range', function() {
      expect(read('range=1y').range).toBe('30d');
    });

    it('falls back to 30d for a custom range without dates', function() {
      expect(read('range=custom')).toEqual(jasmine.objectContaining({ range: '30d', from: null, to: null }));
    });

    it('falls back to 30d for a custom range with an invalid date', function() {
      expect(read('range=custom&from=2026-02-30&to=2026-03-31').range).toBe('30d');
      expect(read('range=custom&from=2026-1-1&to=2026-03-31').range).toBe('30d');
      expect(read('range=custom&from=1969-12-31&to=2026-03-31').range).toBe('30d');
      expect(read('range=custom&from=2026-01-01&to=9999-01-01').range).toBe('30d');
    });

    it('falls back to 30d when from is after to', function() {
      expect(read('range=custom&from=2026-04-01&to=2026-03-31').range).toBe('30d');
    });

    it('falls back to auto for an unknown granularity', function() {
      expect(read('granularity=year').granularity).toBe('auto');
    });

    it('falls back to all for an unknown audience', function() {
      expect(read('audience=robots').audience).toBe('all');
    });

    it('drops a user that is not a positive integer', function() {
      ['0', '-1', 'abc', '1.5', '', '9223372036854775808', '12345678901234567890'].forEach((user) => {
        expect(read(`user=${user}`).user).withContext(user).toBeNull();
      });
    });

    it('accepts the largest id and canonicalizes leading zeros', function() {
      expect(read('user=9223372036854775807').user).toBe('9223372036854775807');
      expect(read('user=007').user).toBe('7');
    });

    it('accepts the unknown domain', function() {
      expect(read('domain=unknown').domain).toBe('unknown');
    });

    it('drops an invalid domain', function() {
      expect(read('domain=example.com').domain).toBeNull();
      expect(read('domain=0').domain).toBeNull();
    });
  });

  describe('.resolveDates', function() {
    const today = '2026-03-31';

    it('resolves 7d', function() {
      expect(StatisticsFilters.resolveDates({ range: '7d' }, today)).toEqual({ from: '2026-03-25', to: today });
    });

    it('resolves 30d', function() {
      expect(StatisticsFilters.resolveDates({ range: '30d' }, today)).toEqual({ from: '2026-03-02', to: today });
    });

    it('resolves 90d', function() {
      expect(StatisticsFilters.resolveDates({ range: '90d' }, today)).toEqual({ from: '2026-01-01', to: today });
    });

    it('resolves 12m', function() {
      expect(StatisticsFilters.resolveDates({ range: '12m' }, today)).toEqual({ from: '2025-04-01', to: today });
    });

    it('resolves 12m from a leap day', function() {
      expect(StatisticsFilters.resolveDates({ range: '12m' }, '2028-02-29'))
        .toEqual({ from: '2027-03-01', to: '2028-02-29' });
    });

    it('crosses year boundaries', function() {
      expect(StatisticsFilters.resolveDates({ range: '7d' }, '2026-01-03')).toEqual({ from: '2025-12-28', to: '2026-01-03' });
    });

    it('returns the custom dates', function() {
      expect(StatisticsFilters.resolveDates({ range: 'custom', from: '2026-01-01', to: '2026-01-05' }, today))
        .toEqual({ from: '2026-01-01', to: '2026-01-05' });
    });

    it('defaults today to the local date', function() {
      const result = StatisticsFilters.resolveDates({ range: '7d' });
      expect(result.to).toBe(StatisticsFilters.today());
    });
  });

  describe('.today', function() {
    it('formats the local date without going through UTC', function() {
      expect(StatisticsFilters.today(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
      expect(StatisticsFilters.today(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
    });
  });

  describe('.isValidDate', function() {
    it('accepts valid dates', function() {
      expect(StatisticsFilters.isValidDate('2024-02-29')).toBeTrue();
    });

    it('rejects invalid dates', function() {
      expect(StatisticsFilters.isValidDate('2025-02-29')).toBeFalse();
      expect(StatisticsFilters.isValidDate(null)).toBeFalse();
      expect(StatisticsFilters.isValidDate('')).toBeFalse();
    });
  });
});
