import {
  DEFAULT_SORT, SORT_KEYS, currentSort, sortHref, sortQuery,
} from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/usersSort.js';
import { DEFAULTS } from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';

describe('usersSort', function() {
  describe('constants', function() {
    it('lists the accepted sort keys', function() {
      expect(SORT_KEYS).toEqual(['visits', 'time_on_site', 'average_duration', 'hits', 'last_seen']);
    });

    it('defaults to visits', function() {
      expect(DEFAULT_SORT).toBe('visits');
    });
  });

  describe('currentSort', function() {
    it('returns every valid sort key', function() {
      SORT_KEYS.forEach((key) => {
        expect(currentSort(new URLSearchParams({ sort: key }))).toBe(key);
      });
    });

    it('falls back to the default for an invalid value', function() {
      expect(currentSort(new URLSearchParams({ sort: 'name' }))).toBe(DEFAULT_SORT);
    });

    it('falls back to the default for an empty value', function() {
      expect(currentSort(new URLSearchParams({ sort: '' }))).toBe(DEFAULT_SORT);
    });

    it('falls back to the default when missing', function() {
      expect(currentSort(new URLSearchParams())).toBe(DEFAULT_SORT);
    });

    describe('without params', function() {
      beforeEach(function() {
        globalThis.window = { location: { hash: '#/staff/statistics/users?range=7d&sort=hits' } };
      });

      afterEach(function() {
        delete globalThis.window;
      });

      it('reads the current hash', function() {
        expect(currentSort()).toBe('hits');
      });
    });
  });

  describe('sortHref', function() {
    it('returns the bare path for the default sort without filters', function() {
      expect(sortHref({ ...DEFAULTS }, 'visits')).toBe('/staff/statistics/users');
    });

    it('adds the sort for a non-default key', function() {
      expect(sortHref({ ...DEFAULTS }, 'hits')).toBe('/staff/statistics/users?sort=hits');
    });

    it('keeps the filters and appends the sort', function() {
      expect(sortHref({ ...DEFAULTS, range: '7d', domain: '3' }, 'last_seen'))
        .toBe('/staff/statistics/users?range=7d&domain=3&sort=last_seen');
    });

    it('keeps the filters and drops the default sort', function() {
      expect(sortHref({ ...DEFAULTS, range: '7d' }, 'visits')).toBe('/staff/statistics/users?range=7d');
    });

    it('never carries the page', function() {
      expect(sortHref({ ...DEFAULTS, page: '3' }, 'hits')).toBe('/staff/statistics/users?sort=hits');
    });
  });

  describe('sortQuery', function() {
    it('is empty for the default sort', function() {
      expect(sortQuery('visits')).toEqual({});
    });

    it('carries a non-default sort', function() {
      expect(sortQuery('time_on_site')).toEqual({ sort: 'time_on_site' });
    });
  });
});
