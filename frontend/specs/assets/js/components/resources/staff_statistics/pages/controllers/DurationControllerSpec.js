import DurationController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/DurationController.js';
import StatisticsQuery
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('DurationController', function() {
  const locale = 'en-GB';
  const LOWERS = [0, 1, 30, 60, 180, 600, 1800, 3600];
  const BIN_KEYS = ['zero', 'under_30s', '30s_1m', '1m_3m', '3m_10m', '10m_30m', '30m_1h', 'over_1h'];
  const emptyMetrics = () => ({
    average_duration_seconds: null,
    median_duration_seconds: null,
    average_hits: null,
    median_hits: null,
  });
  const bucket = (start, end, visits, singleHitVisits, metrics = emptyMetrics()) => ({
    start, end, visits, single_hit_visits: singleHitVisits, ...metrics,
  });
  const histogramFor = (counts = LOWERS.map(() => 0)) => LOWERS.map((lower, index) => ({
    lower,
    upper: index === LOWERS.length - 1 ? null : LOWERS[index + 1],
    count: counts[index],
  }));
  const responseFor = ({
    buckets = [], totals = { visits: 0, single_hit_visits: 0, ...emptyMetrics() },
    histogram = histogramFor(), granularity = 'day',
  } = {}) => ({
    filters: { from: '2026-01-05', to: '2026-01-07', tz: 'UTC', granularity },
    buckets,
    totals,
    histogram,
  });

  describe('.map', function() {
    it('maps an empty response', function() {
      const data = DurationController.map(responseFor({
        buckets: [bucket('2026-01-05', '2026-01-05', 0, 0)],
      }), locale);

      expect(data.points).toEqual([{
        start: '2026-01-05',
        end: '2026-01-05',
        label: '5 Jan',
        visits: 0,
        single_hit_visits: 0,
        singleHitShare: null,
        ...emptyMetrics(),
      }]);
      expect(data.totals).toEqual({
        visits: 0, single_hit_visits: 0, singleHitShare: null, ...emptyMetrics(),
      });
      expect(data.bins.map((bin) => bin.share)).toEqual(LOWERS.map(() => null));
      expect(data.bins.map((bin) => bin.count)).toEqual(LOWERS.map(() => 0));
      expect(data.granularity).toBe('day');
      expect(data.empty).toBeTrue();
    });

    it('maps a single bucket', function() {
      const metrics = {
        average_duration_seconds: 90, median_duration_seconds: 60, average_hits: 3, median_hits: 2,
      };
      const data = DurationController.map(responseFor({
        buckets: [bucket('2026-01-05', '2026-01-11', 4, 1, metrics)],
        totals: { visits: 4, single_hit_visits: 1, ...metrics },
        histogram: histogramFor([1, 0, 0, 2, 1, 0, 0, 0]),
        granularity: 'week',
      }), locale);

      expect(data.points).toEqual([{
        start: '2026-01-05',
        end: '2026-01-11',
        label: '5 Jan',
        visits: 4,
        single_hit_visits: 1,
        singleHitShare: 0.25,
        ...metrics,
      }]);
      expect(data.totals).toEqual({ visits: 4, single_hit_visits: 1, singleHitShare: 0.25, ...metrics });
      expect(data.bins.map((bin) => bin.share)).toEqual([0.25, 0, 0, 0.5, 0.25, 0, 0, 0]);
      expect(data.granularity).toBe('week');
      expect(data.empty).toBeFalse();
    });

    it('keeps the order and keeps null metrics within non-empty data', function() {
      const metrics = {
        average_duration_seconds: 30, median_duration_seconds: 20, average_hits: 2, median_hits: 2,
      };
      const data = DurationController.map(responseFor({
        buckets: [
          bucket('2026-01-05', '2026-01-05', 2, 1, metrics),
          bucket('2026-01-06', '2026-01-06', 0, 0),
          bucket('2026-01-07', '2026-01-07', 5, 5, metrics),
        ],
        totals: { visits: 7, single_hit_visits: 6, ...metrics },
        histogram: histogramFor([6, 1, 0, 0, 0, 0, 0, 0]),
      }), locale);

      expect(data.points.map((point) => point.label)).toEqual(['5 Jan', '6 Jan', '7 Jan']);
      expect(data.points.map((point) => point.singleHitShare)).toEqual([0.5, null, 1]);
      expect(data.points.map((point) => point.average_duration_seconds)).toEqual([30, null, 30]);
      expect(data.points.map((point) => point.median_hits)).toEqual([2, null, 2]);
      expect(data.totals.singleHitShare).toBeCloseTo(6 / 7);
      expect(data.empty).toBeFalse();
    });

    it('maps the 8 histogram bins with their label keys', function() {
      const data = DurationController.map(responseFor({
        totals: { visits: 8, single_hit_visits: 1, ...emptyMetrics() },
        histogram: histogramFor([1, 1, 1, 1, 1, 1, 1, 1]),
      }), locale);

      expect(data.bins.map((bin) => bin.labelKey)).toEqual(BIN_KEYS);
      expect(data.bins[0]).toEqual({ lower: 0, upper: 1, labelKey: 'zero', count: 1, share: 0.125 });
      expect(data.bins[7]).toEqual({
        lower: 3600, upper: null, labelKey: 'over_1h', count: 1, share: 0.125,
      });
    });

    it('defaults to no points nor bins without filters, buckets nor histogram', function() {
      const data = DurationController.map({ totals: { visits: 0, single_hit_visits: 0 } }, locale);

      expect(data.points).toEqual([]);
      expect(data.bins).toEqual([]);
      expect(data.granularity).toBeUndefined();
      expect(data.empty).toBeTrue();
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
      return new DurationController(setData, setLoading, setError).buildEffect()();
    };

    it('requests the duration with the hash query', function() {
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'DurationController',
        resource: 'staffStatistics',
        quantityType: 'duration',
        query,
      });
    });

    it('sets the mapped data and clears loading', async function() {
      const response = responseFor({ buckets: [bucket('2026-01-05', '2026-01-05', 1, 1)] });
      run(Promise.resolve({ data: response }));
      await flushMicrotasks();

      expect(setData).toHaveBeenCalledWith(DurationController.map(response));
      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the translated error and clears loading on failure', async function() {
      run(Promise.reject(new Error('boom')));
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('staff_statistics_page.duration.load_error'));
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
