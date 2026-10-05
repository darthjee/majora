import VisitListController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/VisitListController.js';
import StatisticsQuery
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('VisitListController', function() {
  const visitRow = (overrides = {}) => ({
    id: 7,
    started_at: '2026-01-07T10:00:00Z',
    last_seen_at: '2026-01-07T10:05:00Z',
    duration_seconds: 300,
    hits: 4,
    ongoing: false,
    ip: '10.0.0.1',
    domain: { id: 3, domain: 'example.com' },
    session_id: 'abc123',
    user: {
      id: 5, name: 'Ana', display_name: 'Ana S.', email: 'ana@example.com',
    },
    ...overrides,
  });
  const pagination = { page: 2, pages: 3, perPage: 20, total: 55 };

  describe('.map', function() {
    it('maps a logged-in visit row', function() {
      const data = VisitListController.map([visitRow()], pagination, 'started_at');

      expect(data.rows).toEqual([{
        id: 7,
        startedAt: '2026-01-07T10:00:00Z',
        lastSeenAt: '2026-01-07T10:05:00Z',
        durationSeconds: 300,
        hits: 4,
        ongoing: false,
        ip: '10.0.0.1',
        domain: 'example.com',
        sessionId: 'abc123',
        user: {
          id: 5, name: 'Ana', displayName: 'Ana S.', email: 'ana@example.com',
        },
      }]);
      expect(data.empty).toBeFalse();
    });

    it('keeps the user null for an anonymous visit', function() {
      const data = VisitListController.map([visitRow({ user: null, ongoing: true })], pagination, 'started_at');

      expect(data.rows[0].user).toBeNull();
      expect(data.rows[0].ongoing).toBeTrue();
      expect(data.rows[0].sessionId).toBe('abc123');
    });

    it('labels the unknown domain', function() {
      const data = VisitListController.map([visitRow({ domain: { id: 'unknown', domain: null } })], pagination, 'hits');

      expect(data.rows[0].domain).toBe(Translator.t('staff_statistics_page.visit_list.unknown_domain'));
    });

    it('keeps a missing domain null', function() {
      const data = VisitListController.map([visitRow({ domain: null })], pagination, 'hits');

      expect(data.rows[0].domain).toBeNull();
    });

    it('keeps the API order', function() {
      const data = VisitListController.map([visitRow({ id: 9 }), visitRow({ id: 2 })], pagination, 'hits');

      expect(data.rows.map((row) => row.id)).toEqual([9, 2]);
    });

    it('exposes the pagination and the sort', function() {
      const data = VisitListController.map([visitRow()], pagination, 'duration');

      expect(data.page).toBe(2);
      expect(data.pages).toBe(3);
      expect(data.perPage).toBe(20);
      expect(data.sort).toBe('duration');
    });

    it('flags an empty list', function() {
      const data = VisitListController.map([], pagination, 'started_at');

      expect(data.rows).toEqual([]);
      expect(data.empty).toBeTrue();
    });

    it('defaults a non-array body and missing pagination', function() {
      const data = VisitListController.map(null, undefined, 'started_at');

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
      globalThis.window = { location: { hash: '#/staff/statistics/visit-list' } };
    });

    afterEach(function() {
      delete globalThis.window;
    });

    const run = (result) => {
      spyOn(RequestStore, 'ensure').and.returnValue(result);
      return new VisitListController(setData, setLoading, setError).buildEffect()();
    };

    it('requests the visit list without sort for the default sort', function() {
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'VisitListController',
        resource: 'staffStatistics',
        quantityType: 'visitList',
        query,
      });
    });

    it('requests the hash sort and pagination', function() {
      globalThis.window.location.hash = '#/staff/statistics/visit-list?sort=duration&page=2&per_page=50';
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        query: { ...query, sort: 'duration', page: '2', per_page: '50' },
      }));
    });

    it('drops an invalid hash sort', function() {
      globalThis.window.location.hash = '#/staff/statistics/visit-list?sort=visits';
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({ query }));
    });

    it('sets the mapped data and clears loading', async function() {
      globalThis.window.location.hash = '#/staff/statistics/visit-list?sort=hits';
      run(Promise.resolve({ data: [visitRow()], pagination }));
      await flushMicrotasks();

      expect(setData).toHaveBeenCalledWith(VisitListController.map([visitRow()], pagination, 'hits'));
      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the translated error and clears loading on failure', async function() {
      run(Promise.reject(new Error('boom')));
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('staff_statistics_page.visit_list.load_error'));
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
