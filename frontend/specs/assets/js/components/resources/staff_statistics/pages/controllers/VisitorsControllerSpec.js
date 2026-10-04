import VisitorsController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/VisitorsController.js';
import StatisticsQuery
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('VisitorsController', function() {
  const locale = 'en-GB';
  const KEYS = ['unique_visitors', 'new_visitors', 'returning_visitors', 'anonymous', 'logged_in'];
  const bucket = (start, end, newVisitors, returning, anonymous) => ({
    start,
    end,
    unique_visitors: newVisitors + returning,
    new_visitors: newVisitors,
    returning_visitors: returning,
    anonymous,
    logged_in: newVisitors + returning - anonymous,
  });
  const zeroTotals = () => Object.fromEntries(KEYS.map((key) => [key, 0]));
  const responseFor = ({ buckets = [], audience = 'all', granularity = 'day' } = {}) => {
    const totals = buckets.reduce(
      (acc, item) => Object.fromEntries(KEYS.map((key) => [key, acc[key] + item[key]])),
      zeroTotals(),
    );

    return {
      filters: { from: '2026-01-05', to: '2026-01-07', tz: 'UTC', granularity, audience },
      buckets,
      totals,
    };
  };

  describe('.map', function() {
    it('maps an empty response', function() {
      expect(VisitorsController.map(responseFor(), locale)).toEqual({
        points: [],
        audienceSeries: ['anonymous', 'logged_in'],
        totals: zeroTotals(),
        audience: 'all',
        granularity: 'day',
        empty: true,
      });
    });

    it('maps zero-filled buckets as empty with null shares', function() {
      const data = VisitorsController.map(responseFor({
        buckets: [bucket('2026-01-05', '2026-01-05', 0, 0, 0), bucket('2026-01-06', '2026-01-06', 0, 0, 0)],
      }), locale);

      expect(data.points.length).toBe(2);
      expect(data.points.map((point) => point.returningShare)).toEqual([null, null]);
      expect(data.points.map((point) => point.loggedInShare)).toEqual([null, null]);
      expect(data.empty).toBeTrue();
    });

    it('maps a single bucket', function() {
      const data = VisitorsController.map(responseFor({
        buckets: [bucket('2026-01-05', '2026-01-11', 3, 1, 3)], granularity: 'week',
      }), locale);

      expect(data.points).toEqual([{
        start: '2026-01-05',
        end: '2026-01-11',
        label: '5 Jan',
        unique_visitors: 4,
        new_visitors: 3,
        returning_visitors: 1,
        anonymous: 3,
        logged_in: 1,
        returningShare: 0.25,
        loggedInShare: 0.25,
      }]);
      expect(data.granularity).toBe('week');
      expect(data.empty).toBeFalse();
    });

    it('keeps the order and flags zero buckets with null shares', function() {
      const data = VisitorsController.map(responseFor({
        buckets: [
          bucket('2026-01-05', '2026-01-05', 2, 2, 1),
          bucket('2026-01-06', '2026-01-06', 0, 0, 0),
          bucket('2026-01-07', '2026-01-07', 0, 5, 0),
        ],
      }), locale);

      expect(data.points.map((point) => point.label)).toEqual(['5 Jan', '6 Jan', '7 Jan']);
      expect(data.points.map((point) => point.returningShare)).toEqual([0.5, null, 1]);
      expect(data.points.map((point) => point.loggedInShare)).toEqual([0.75, null, 1]);
      expect(data.totals).toEqual({
        unique_visitors: 9, new_visitors: 2, returning_visitors: 7, anonymous: 1, logged_in: 8,
      });
      expect(data.empty).toBeFalse();
    });

    it('shows both audience series for the all audience', function() {
      const data = VisitorsController.map(responseFor({ audience: 'all' }), locale);

      expect(data.audienceSeries).toEqual(['anonymous', 'logged_in']);
      expect(data.audience).toBe('all');
    });

    it('shows only anonymous visitors for the anonymous audience', function() {
      const data = VisitorsController.map(responseFor({ audience: 'anonymous' }), locale);

      expect(data.audienceSeries).toEqual(['anonymous']);
      expect(data.audience).toBe('anonymous');
    });

    it('shows only logged-in visitors for the logged_in audience', function() {
      const data = VisitorsController.map(responseFor({ audience: 'logged_in' }), locale);

      expect(data.audienceSeries).toEqual(['logged_in']);
      expect(data.audience).toBe('logged_in');
    });

    it('defaults to both series without an audience filter', function() {
      const response = responseFor();
      delete response.filters.audience;

      const data = VisitorsController.map(response, locale);

      expect(data.audienceSeries).toEqual(['anonymous', 'logged_in']);
      expect(data.audience).toBe('all');
    });

    it('defaults to no points without filters nor buckets', function() {
      const data = VisitorsController.map({ totals: zeroTotals() }, locale);

      expect(data.points).toEqual([]);
      expect(data.audience).toBe('all');
      expect(data.granularity).toBeUndefined();
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
      return new VisitorsController(setData, setLoading, setError).buildEffect()();
    };

    it('requests the visitors with the hash query', function() {
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'VisitorsController',
        resource: 'staffStatistics',
        quantityType: 'visitors',
        query,
      });
    });

    it('sets the mapped data and clears loading', async function() {
      const response = responseFor({ buckets: [bucket('2026-01-05', '2026-01-05', 1, 1, 1)] });
      run(Promise.resolve({ data: response }));
      await flushMicrotasks();

      expect(setData).toHaveBeenCalledWith(VisitorsController.map(response));
      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the translated error and clears loading on failure', async function() {
      run(Promise.reject(new Error('boom')));
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('staff_statistics_page.visitors.load_error'));
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
