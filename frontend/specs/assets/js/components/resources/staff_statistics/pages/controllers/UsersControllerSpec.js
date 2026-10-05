import UsersController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/UsersController.js';
import StatisticsQuery
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('UsersController', function() {
  const userRow = (overrides = {}) => ({
    id: 5,
    name: 'Ana',
    display_name: 'Ana S.',
    email: 'ana@example.com',
    visits: 12,
    time_on_site_seconds: 3600,
    average_duration_seconds: 300,
    hits: 40,
    domains: [{ id: 3, domain: 'example.com' }],
    last_seen_at: '2026-01-07T10:00:00Z',
    ...overrides,
  });
  const pagination = { page: 2, pages: 3, perPage: 20, total: 55 };

  describe('.map', function() {
    it('maps a user row', function() {
      const data = UsersController.map([userRow()], pagination, 'visits');

      expect(data.rows).toEqual([{
        id: 5,
        name: 'Ana',
        displayName: 'Ana S.',
        email: 'ana@example.com',
        visits: 12,
        timeOnSiteSeconds: 3600,
        averageDurationSeconds: 300,
        hits: 40,
        domains: ['example.com'],
        lastSeenAt: '2026-01-07T10:00:00Z',
      }]);
      expect(data.empty).toBeFalse();
    });

    it('labels the unknown domain', function() {
      const data = UsersController.map([userRow({
        domains: [{ id: 3, domain: 'example.com' }, { id: 'unknown', domain: null }],
      })], pagination, 'visits');

      expect(data.rows[0].domains).toEqual([
        'example.com', Translator.t('staff_statistics_page.users.unknown_domain'),
      ]);
    });

    it('defaults missing domains to an empty list', function() {
      const data = UsersController.map([userRow({ domains: undefined })], pagination, 'visits');

      expect(data.rows[0].domains).toEqual([]);
    });

    it('keeps the API order', function() {
      const data = UsersController.map([userRow({ id: 9 }), userRow({ id: 2 })], pagination, 'hits');

      expect(data.rows.map((row) => row.id)).toEqual([9, 2]);
    });

    it('exposes the pagination and the sort', function() {
      const data = UsersController.map([userRow()], pagination, 'hits');

      expect(data.page).toBe(2);
      expect(data.pages).toBe(3);
      expect(data.perPage).toBe(20);
      expect(data.sort).toBe('hits');
    });

    it('flags an empty list', function() {
      const data = UsersController.map([], pagination, 'visits');

      expect(data.rows).toEqual([]);
      expect(data.empty).toBeTrue();
    });

    it('defaults a non-array body and missing pagination', function() {
      const data = UsersController.map(null, undefined, 'visits');

      expect(data.rows).toEqual([]);
      expect(data.empty).toBeTrue();
      expect(data.page).toBe(1);
      expect(data.pages).toBe(1);
      expect(data.perPage).toBeUndefined();
    });
  });

  describe('#buildEffect', function() {
    const query = { from: '2026-01-05', to: '2026-01-07', tz: 'UTC' };
    let setData;
    let setLoading;
    let setError;

    beforeEach(function() {
      setData = jasmine.createSpy('setData');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      spyOn(StatisticsQuery, 'fromHash').and.returnValue(query);
      globalThis.window = { location: { hash: '#/staff/statistics/users' } };
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const run = (result) => {
      spyOn(RequestStore, 'ensure').and.returnValue(result);
      return new UsersController(setData, setLoading, setError).buildEffect()();
    };

    it('requests the users ranking without sort for the default sort', function() {
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'UsersController',
        resource: 'staffStatistics',
        quantityType: 'usersRanking',
        query,
      });
    });

    it('requests the hash sort and pagination', function() {
      globalThis.window.location.hash = '#/staff/statistics/users?sort=hits&page=2&per_page=50';
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        query: { ...query, sort: 'hits', page: '2', per_page: '50' },
      }));
    });

    it('drops an invalid hash sort', function() {
      globalThis.window.location.hash = '#/staff/statistics/users?sort=name';
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({ query }));
    });

    it('sets the mapped data and clears loading', async function() {
      globalThis.window.location.hash = '#/staff/statistics/users?sort=last_seen';
      run(Promise.resolve({ data: [userRow()], pagination }));
      await flushMicrotasks();

      expect(setData).toHaveBeenCalledWith(UsersController.map([userRow()], pagination, 'last_seen'));
      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the translated error and clears loading on failure', async function() {
      run(Promise.reject(new Error('boom')));
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('staff_statistics_page.users.load_error'));
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('does not set anything after the cleanup runs', async function() {
      run(Promise.resolve({ data: [], pagination }))();
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });

    it('does not set the error after the cleanup runs', async function() {
      run(Promise.reject(new Error('boom')))();
      await flushMicrotasks();

      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
