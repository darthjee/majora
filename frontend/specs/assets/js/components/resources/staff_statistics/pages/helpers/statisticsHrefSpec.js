import statisticsHref from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/statisticsHref.js';
import { DEFAULTS } from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';

describe('statisticsHref', function() {
  const path = '#/staff/statistics/visits';

  it('returns the bare path when every filter is at its default', function() {
    expect(statisticsHref(path, { ...DEFAULTS })).toBe(path);
  });

  it('returns the bare path for an empty filter object', function() {
    expect(statisticsHref(path, {})).toBe(path);
  });

  it('writes non-default filters', function() {
    const filters = { ...DEFAULTS, range: '7d', granularity: 'week', user: '5', domain: 'unknown', audience: 'anonymous' };
    expect(statisticsHref(path, filters))
      .toBe(`${path}?range=7d&granularity=week&user=5&domain=unknown&audience=anonymous`);
  });

  it('writes from / to for a custom range', function() {
    const filters = { ...DEFAULTS, range: 'custom', from: '2026-01-01', to: '2026-03-31', audience: 'logged_in' };
    expect(statisticsHref(path, filters))
      .toBe(`${path}?range=custom&from=2026-01-01&to=2026-03-31&audience=logged_in`);
  });

  it('drops from / to for a preset range', function() {
    expect(statisticsHref(path, { ...DEFAULTS, range: '90d', from: '2026-01-01', to: '2026-03-31' }))
      .toBe(`${path}?range=90d`);
  });

  it('never writes tab-specific params', function() {
    expect(statisticsHref(path, { ...DEFAULTS, page: '3', per_page: '50', sort: 'visits' })).toBe(path);
  });
});
