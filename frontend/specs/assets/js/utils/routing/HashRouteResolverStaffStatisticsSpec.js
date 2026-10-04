import HashRouteResolver from '../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('HashRouteResolver access statistics', function() {
  const pageFor = (hash) => new HashRouteResolver(() => hash).getPage();

  describe('#getPage', function() {
    [
      ['#/staff/statistics', 'staffStatistics'],
      ['#/staff/statistics/visits', 'staffStatisticsVisits'],
      ['#/staff/statistics/visitors', 'staffStatisticsVisitors'],
      ['#/staff/statistics/duration', 'staffStatisticsDuration'],
      ['#/staff/statistics/domains', 'staffStatisticsDomains'],
      ['#/staff/statistics/users', 'staffStatisticsUsers'],
      ['#/staff/statistics/visit-list', 'staffStatisticsVisitList'],
    ].forEach(([hash, page]) => {
      it(`resolves ${hash} to ${page}`, function() {
        expect(pageFor(hash)).toBe(page);
      });
    });

    it('resolves tab routes before the landing route, ignoring the query', function() {
      expect(pageFor('#/staff/statistics/visit-list?range=7d&page=2')).toBe('staffStatisticsVisitList');
      expect(pageFor('#/staff/statistics?range=7d')).toBe('staffStatistics');
    });
  });

  describe('#getFilterParams', function() {
    it('exposes the statistics filter keys, without page / per_page / sort', function() {
      const params = new HashRouteResolver(
        () => '#/staff/statistics/visits?range=custom&from=2026-01-01&to=2026-03-31'
          + '&granularity=week&user=5&domain=unknown&audience=logged_in&page=2&per_page=10&sort=visits',
      ).getFilterParams();

      expect(params.toString()).toBe(
        'range=custom&from=2026-01-01&to=2026-03-31&granularity=week&user=5&domain=unknown&audience=logged_in',
      );
    });
  });
});
