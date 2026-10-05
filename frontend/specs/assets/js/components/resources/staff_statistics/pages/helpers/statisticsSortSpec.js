import { createStatisticsSort }
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/statisticsSort.js';
import { DEFAULTS } from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';

describe('createStatisticsSort', function() {
  const sorting = createStatisticsSort({
    path: '/staff/statistics/sample',
    keys: ['alpha', 'beta', 'gamma'],
    defaultSort: 'alpha',
  });

  it('returns a frozen object', function() {
    expect(Object.isFrozen(sorting)).toBeTrue();
  });

  describe('constants', function() {
    it('exposes the frozen sort keys', function() {
      expect(sorting.SORT_KEYS).toEqual(['alpha', 'beta', 'gamma']);
      expect(Object.isFrozen(sorting.SORT_KEYS)).toBeTrue();
    });

    it('exposes the default sort', function() {
      expect(sorting.DEFAULT_SORT).toBe('alpha');
    });
  });

  describe('currentSort', function() {
    it('returns every valid sort key', function() {
      sorting.SORT_KEYS.forEach((key) => {
        expect(sorting.currentSort(new URLSearchParams({ sort: key }))).toBe(key);
      });
    });

    it('falls back to the default for an invalid value', function() {
      expect(sorting.currentSort(new URLSearchParams({ sort: 'delta' }))).toBe('alpha');
    });

    it('falls back to the default for an empty value', function() {
      expect(sorting.currentSort(new URLSearchParams({ sort: '' }))).toBe('alpha');
    });

    it('falls back to the default when missing', function() {
      expect(sorting.currentSort(new URLSearchParams())).toBe('alpha');
    });

    describe('without params', function() {
      beforeEach(function() {
        globalThis.window = { location: { hash: '#/staff/statistics/sample?range=7d&sort=gamma' } };
      });

      afterEach(function() {
        delete globalThis.window;
      });

      it('reads the current hash', function() {
        expect(sorting.currentSort()).toBe('gamma');
      });
    });
  });

  describe('sortHref', function() {
    it('returns the bare path for the default sort without filters', function() {
      expect(sorting.sortHref({ ...DEFAULTS }, 'alpha')).toBe('/staff/statistics/sample');
    });

    it('adds the sort for a non-default key', function() {
      expect(sorting.sortHref({ ...DEFAULTS }, 'beta')).toBe('/staff/statistics/sample?sort=beta');
    });

    it('keeps the filters and appends the sort', function() {
      expect(sorting.sortHref({ ...DEFAULTS, range: '7d', domain: '3' }, 'gamma'))
        .toBe('/staff/statistics/sample?range=7d&domain=3&sort=gamma');
    });

    it('keeps the filters and drops the default sort', function() {
      expect(sorting.sortHref({ ...DEFAULTS, range: '7d' }, 'alpha')).toBe('/staff/statistics/sample?range=7d');
    });

    it('never carries the page', function() {
      expect(sorting.sortHref({ ...DEFAULTS, page: '3' }, 'beta')).toBe('/staff/statistics/sample?sort=beta');
    });
  });

  describe('sortQuery', function() {
    it('is empty for the default sort', function() {
      expect(sorting.sortQuery('alpha')).toEqual({});
    });

    it('carries a non-default sort', function() {
      expect(sorting.sortQuery('beta')).toEqual({ sort: 'beta' });
    });
  });
});
