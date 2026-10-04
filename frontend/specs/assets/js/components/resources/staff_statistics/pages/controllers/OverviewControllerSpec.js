import OverviewController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/OverviewController.js';
import StatisticsQuery
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('OverviewController', function() {
  const totalsFor = (overrides = {}) => ({
    visits: 120,
    unique_visitors: 40,
    logged_in_users: 5,
    new_visitors: 30,
    returning_visitors: 10,
    average_duration_seconds: 274,
    ...overrides,
  });
  const responseFor = (overrides = {}) => ({
    filters: { from: '2026-01-05', to: '2026-01-07', tz: 'UTC', audience: 'all' },
    totals: totalsFor(overrides),
  });
  const emptyTotals = {
    visits: 0,
    unique_visitors: 0,
    logged_in_users: 0,
    new_visitors: 0,
    returning_visitors: 0,
    average_duration_seconds: null,
  };

  describe('.map', function() {
    it('maps normal data with the returning share', function() {
      const response = responseFor();

      expect(OverviewController.map(response)).toEqual({
        totals: response.totals,
        returningShare: 0.25,
        empty: false,
      });
    });

    it('maps an empty range with a null share', function() {
      expect(OverviewController.map({ filters: {}, totals: emptyTotals })).toEqual({
        totals: emptyTotals,
        returningShare: null,
        empty: true,
      });
    });

    it('returns a null share when there are no unique visitors', function() {
      const data = OverviewController.map(responseFor({ unique_visitors: 0, returning_visitors: 0 }));

      expect(data.returningShare).toBeNull();
      expect(data.empty).toBeFalse();
    });

    it('keeps a null average duration', function() {
      const data = OverviewController.map(responseFor({ average_duration_seconds: null }));

      expect(data.totals.average_duration_seconds).toBeNull();
      expect(data.returningShare).toBe(0.25);
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
    });

    const run = (result) => {
      spyOn(RequestStore, 'ensure').and.returnValue(result);
      return new OverviewController(setData, setLoading, setError).buildEffect()();
    };

    it('requests the overview with the hash query', function() {
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'OverviewController',
        resource: 'staffStatistics',
        quantityType: 'overview',
        query,
      });
    });

    it('sets the mapped data and clears loading', async function() {
      const response = responseFor();
      run(Promise.resolve({ data: response }));
      await flushMicrotasks();

      expect(setData).toHaveBeenCalledWith(OverviewController.map(response));
      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the translated error and clears loading on failure', async function() {
      run(Promise.reject(new Error('boom')));
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('staff_statistics_page.overview.load_error'));
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('does not set anything after the cleanup runs', async function() {
      run(Promise.resolve({ data: responseFor() }))();
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
