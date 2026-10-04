import StatisticsQuery from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import HashRouteResolver from '../../../../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('StatisticsQuery', function() {
  const today = '2026-03-31';
  const tz = 'Europe/Lisbon';
  const queryFor = (hash) => StatisticsQuery.fromHash(new HashRouteResolver(() => hash), today, tz);

  describe('.fromHash', function() {
    it('resolves the default range and adds tz', function() {
      expect(queryFor('#/staff/statistics')).toEqual({ from: '2026-03-02', to: today, tz });
    });

    it('resolves a preset range and drops range', function() {
      expect(queryFor('#/staff/statistics?range=7d')).toEqual({ from: '2026-03-25', to: today, tz });
    });

    it('keeps a custom range', function() {
      expect(queryFor('#/staff/statistics/visits?range=custom&from=2026-01-01&to=2026-01-31'))
        .toEqual({ from: '2026-01-01', to: '2026-01-31', tz });
    });

    it('adds the non-default filters', function() {
      expect(queryFor('#/staff/statistics?granularity=week&user=5&domain=unknown&audience=anonymous')).toEqual({
        from: '2026-03-02', to: today, tz, granularity: 'week', user: '5', domain: 'unknown', audience: 'anonymous',
      });
    });

    it('omits defaults and invalid values', function() {
      expect(queryFor('#/staff/statistics?granularity=auto&audience=all&user=abc&domain=x&page=2'))
        .toEqual({ from: '2026-03-02', to: today, tz });
    });

    it('defaults to the current hash, local date and browser zone', function() {
      const query = StatisticsQuery.fromHash();

      expect(query.tz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
      expect(query.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(query.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
