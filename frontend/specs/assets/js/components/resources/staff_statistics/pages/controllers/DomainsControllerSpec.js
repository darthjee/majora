import DomainsController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/controllers/DomainsController.js';
import StatisticsQuery
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../support/flushMicrotasks.js';

describe('DomainsController', function() {
  const zeroTotals = () => ({
    visits: 0, anonymous: 0, logged_in: 0, unique_visitors: 0,
    average_duration_seconds: null, median_duration_seconds: null,
  });
  const row = (id, domain, group, metrics = {}) => ({
    id, domain, group, ...zeroTotals(), ...metrics,
  });
  const responseFor = ({ domains = [], totals = zeroTotals(), audience = 'all' } = {}) => ({
    filters: { from: '2026-01-05', to: '2026-01-07', tz: 'UTC', domain: null, audience },
    domains,
    totals,
  });
  const exampleRow = () => row(3, 'example.com', 'Search', {
    visits: 10, anonymous: 7, logged_in: 3, unique_visitors: 8,
    average_duration_seconds: 120, median_duration_seconds: 90,
  });
  const unknownRow = () => row('unknown', null, null, {
    visits: 2, anonymous: 2, logged_in: 0, unique_visitors: 2,
  });

  describe('.map', function() {
    it('maps an empty domains list', function() {
      const data = DomainsController.map(responseFor());

      expect(data.domains).toEqual([]);
      expect(data.totals).toEqual(zeroTotals());
      expect(data.empty).toBeTrue();
      expect(data.noRows).toBeTrue();
    });

    it('maps zero rows with zero totals', function() {
      const data = DomainsController.map(responseFor({
        domains: [row(7, 'staging.example.com', 'Majora'), row('unknown', null, null)],
      }));

      expect(data.domains.map((domain) => domain.visits)).toEqual([0, 0]);
      expect(data.domains.map((domain) => domain.loggedInShare)).toEqual([null, null]);
      expect(data.empty).toBeTrue();
      expect(data.noRows).toBeFalse();
    });

    it('maps a single row', function() {
      const totals = { ...exampleRow() };
      delete totals.id;
      delete totals.domain;
      delete totals.group;
      const data = DomainsController.map(responseFor({ domains: [exampleRow()], totals }));

      expect(data.domains).toEqual([{
        id: 3,
        domain: 'example.com',
        group: 'Search',
        label: 'example.com',
        anonymous: 7,
        logged_in: 3,
        visits: 10,
        unique_visitors: 8,
        average_duration_seconds: 120,
        median_duration_seconds: 90,
        loggedInShare: 0.3,
        unknown: false,
      }]);
      expect(data.totals).toEqual(totals);
      expect(data.empty).toBeFalse();
      expect(data.noRows).toBeFalse();
    });

    it('keeps the API order, null durations and labels the unknown row', function() {
      const data = DomainsController.map(responseFor({
        domains: [exampleRow(), row(7, 'staging.example.com', 'Majora'), unknownRow()],
        totals: {
          visits: 12, anonymous: 9, logged_in: 3, unique_visitors: 10,
          average_duration_seconds: 110, median_duration_seconds: 90,
        },
      }));

      expect(data.domains.map((domain) => domain.id)).toEqual([3, 7, 'unknown']);
      expect(data.domains.map((domain) => domain.label)).toEqual([
        'example.com', 'staging.example.com', Translator.t('staff_statistics_page.domains.unknown'),
      ]);
      expect(data.domains.map((domain) => domain.unknown)).toEqual([false, false, true]);
      expect(data.domains.map((domain) => domain.average_duration_seconds)).toEqual([120, null, null]);
      expect(data.domains.map((domain) => domain.median_duration_seconds)).toEqual([90, null, null]);
      expect(data.domains.map((domain) => domain.loggedInShare)).toEqual([0.3, null, 0]);
      expect(data.domains[2].domain).toBeNull();
      expect(data.domains[2].group).toBeNull();
      expect(data.empty).toBeFalse();
    });

    it('shows both series for the all audience', function() {
      const data = DomainsController.map(responseFor({ audience: 'all' }));

      expect(data.series).toEqual(['anonymous', 'logged_in']);
      expect(data.audience).toBe('all');
    });

    it('shows only the anonymous series for the anonymous audience', function() {
      const data = DomainsController.map(responseFor({ audience: 'anonymous' }));

      expect(data.series).toEqual(['anonymous']);
      expect(data.audience).toBe('anonymous');
    });

    it('shows only the logged-in series for the logged_in audience', function() {
      const data = DomainsController.map(responseFor({ audience: 'logged_in' }));

      expect(data.series).toEqual(['logged_in']);
      expect(data.audience).toBe('logged_in');
    });

    it('exposes the response filters', function() {
      const response = responseFor();

      expect(DomainsController.map(response).filters).toEqual(response.filters);
    });

    it('defaults to no rows, both series and empty filters without filters nor domains', function() {
      const data = DomainsController.map({ totals: zeroTotals() });

      expect(data.domains).toEqual([]);
      expect(data.series).toEqual(['anonymous', 'logged_in']);
      expect(data.filters).toEqual({});
      expect(data.audience).toBeUndefined();
      expect(data.noRows).toBeTrue();
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
      return new DomainsController(setData, setLoading, setError).buildEffect()();
    };

    it('requests the domains summary with the hash query', function() {
      run(new Promise(() => undefined));

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'DomainsController',
        resource: 'staffStatistics',
        quantityType: 'domainsSummary',
        query,
      });
    });

    it('sets the mapped data and clears loading', async function() {
      const response = responseFor({ domains: [unknownRow()] });
      run(Promise.resolve({ data: response }));
      await flushMicrotasks();

      expect(setData).toHaveBeenCalledWith(DomainsController.map(response));
      expect(setError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the translated error and clears loading on failure', async function() {
      run(Promise.reject(new Error('boom')));
      await flushMicrotasks();

      expect(setData).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('staff_statistics_page.domains.load_error'));
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
