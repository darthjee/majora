import VisitsController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/VisitsController.js';
import StatisticsQuery
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('VisitsController', function() {
  const locale = 'en-GB';
  const bucket = (start, end, anonymous, loggedIn) => ({
    start, end, anonymous, logged_in: loggedIn, visits: anonymous + loggedIn,
  });
  const responseFor = ({ buckets = [], audience = 'all', granularity = 'day' } = {}) => {
    const totals = buckets.reduce((acc, item) => ({
      anonymous: acc.anonymous + item.anonymous,
      logged_in: acc.logged_in + item.logged_in,
      visits: acc.visits + item.visits,
    }), { anonymous: 0, logged_in: 0, visits: 0 });

    return {
      filters: { from: '2026-01-05', to: '2026-01-07', tz: 'UTC', granularity, audience },
      buckets,
      totals,
    };
  };

  describe('.map', function() {
    it('maps an empty response', function() {
      expect(VisitsController.map(responseFor(), locale)).toEqual({
        points: [],
        series: ['anonymous', 'logged_in'],
        totals: { anonymous: 0, logged_in: 0, visits: 0 },
        audience: 'all',
        granularity: 'day',
        empty: true,
      });
    });

    it('maps a single bucket', function() {
      const data = VisitsController.map(responseFor({
        buckets: [bucket('2026-01-05', '2026-01-11', 3, 1)], granularity: 'week',
      }), locale);

      expect(data.points).toEqual([{
        start: '2026-01-05', end: '2026-01-11', label: '5 Jan',
        anonymous: 3, logged_in: 1, visits: 4, loggedInShare: 0.25,
      }]);
      expect(data.granularity).toBe('week');
      expect(data.empty).toBeFalse();
    });

    it('keeps the order and flags zero buckets with a null share', function() {
      const data = VisitsController.map(responseFor({
        buckets: [
          bucket('2026-01-05', '2026-01-05', 2, 2),
          bucket('2026-01-06', '2026-01-06', 0, 0),
          bucket('2026-01-07', '2026-01-07', 0, 5),
        ],
      }), locale);

      expect(data.points.map((point) => point.label)).toEqual(['5 Jan', '6 Jan', '7 Jan']);
      expect(data.points.map((point) => point.loggedInShare)).toEqual([0.5, null, 1]);
      expect(data.totals).toEqual({ anonymous: 2, logged_in: 7, visits: 9 });
      expect(data.empty).toBeFalse();
    });

    it('stacks only anonymous visits for the anonymous audience', function() {
      const data = VisitsController.map(responseFor({ audience: 'anonymous' }), locale);

      expect(data.series).toEqual(['anonymous']);
      expect(data.audience).toBe('anonymous');
    });

    it('stacks only logged-in visits for the logged_in audience', function() {
      const data = VisitsController.map(responseFor({ audience: 'logged_in' }), locale);

      expect(data.series).toEqual(['logged_in']);
      expect(data.audience).toBe('logged_in');
    });

    it('defaults to both series without an audience filter', function() {
      const response = responseFor();
      delete response.filters.audience;

      const data = VisitsController.map(response, locale);

      expect(data.series).toEqual(['anonymous', 'logged_in']);
      expect(data.audience).toBe('all');
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
      return new VisitsController(setData, setLoading, setError).buildEffect()();
    };

    it('requests the visits with the hash query', function() {
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'VisitsController',
        resource: 'staffStatistics',
        quantityType: 'visits',
        query,
      });
    });

    it('sets the mapped data and clears loading', async function() {
      const response = responseFor({ buckets: [bucket('2026-01-05', '2026-01-05', 1, 1)] });
      run(Promise.resolve({ data: response }));
      await flushMicrotasks();

      expect(setData).toHaveBeenCalledWith(VisitsController.map(response));
      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the translated error and clears loading on failure', async function() {
      run(Promise.reject(new Error('boom')));
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('staff_statistics_page.visits.load_error'));
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
