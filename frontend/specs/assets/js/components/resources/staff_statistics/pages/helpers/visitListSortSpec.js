import {
  DEFAULT_SORT, SORT_KEYS, currentSort, sortHref, sortQuery,
} from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/visitListSort.js';
import { DEFAULTS } from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';

describe('visitListSort', function() {
  it('lists the accepted sort keys', function() {
    expect(SORT_KEYS).toEqual(['started_at', 'last_seen', 'duration', 'hits']);
  });

  it('defaults to started_at', function() {
    expect(DEFAULT_SORT).toBe('started_at');
  });

  it('falls back to started_at for an invalid sort', function() {
    expect(currentSort(new URLSearchParams({ sort: 'visits' }))).toBe('started_at');
  });

  it('accepts the duration sort', function() {
    expect(currentSort(new URLSearchParams({ sort: 'duration' }))).toBe('duration');
  });

  it('links to the visit list path', function() {
    expect(sortHref({ ...DEFAULTS }, 'started_at')).toBe('/staff/statistics/visit-list');
    expect(sortHref({ ...DEFAULTS, range: '7d' }, 'hits')).toBe('/staff/statistics/visit-list?range=7d&sort=hits');
  });

  it('omits the default sort from the query', function() {
    expect(sortQuery('started_at')).toEqual({});
    expect(sortQuery('last_seen')).toEqual({ sort: 'last_seen' });
  });
});
