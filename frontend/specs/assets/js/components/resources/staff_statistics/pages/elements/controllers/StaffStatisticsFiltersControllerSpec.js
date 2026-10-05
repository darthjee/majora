import StaffStatisticsFiltersController
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/controllers/StaffStatisticsFiltersController.js';
import { DEFAULTS } from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import flushMicrotasks from '../../../../../../../../support/flushMicrotasks.js';

describe('StaffStatisticsFiltersController', function() {
  const tabPath = '#/staff/statistics/visits';
  let setters;
  let navigate;
  let controller;

  beforeEach(function() {
    setters = {
      setRangeDraft: jasmine.createSpy('setRangeDraft'),
      setCustomFrom: jasmine.createSpy('setCustomFrom'),
      setCustomTo: jasmine.createSpy('setCustomTo'),
      setDomains: jasmine.createSpy('setDomains'),
    };
    navigate = jasmine.createSpy('navigate');
    controller = new StaffStatisticsFiltersController({ tabPath, ...setters, navigate });
  });

  describe('.currentFilters', function() {
    it('reads the normalized filters from the hash', function() {
      const resolver = new HashRouteResolver(() => '#/staff/statistics?range=7d&audience=bots&user=4');

      expect(StaffStatisticsFiltersController.currentFilters(resolver)).toEqual({
        ...DEFAULTS, range: '7d', user: '4',
      });
    });

    it('defaults to the current window hash', function() {
      const originalWindow = globalThis.window;
      globalThis.window = { location: { hash: '#/staff/statistics?granularity=month' } };

      expect(StaffStatisticsFiltersController.currentFilters().granularity).toBe('month');

      globalThis.window = originalWindow;
    });
  });

  describe('.initialState', function() {
    it('pre-fills the custom dates with the preset dates', function() {
      expect(StaffStatisticsFiltersController.initialState({ ...DEFAULTS, range: '7d' }, '2026-03-31'))
        .toEqual({ rangeDraft: '7d', customFrom: '2026-03-25', customTo: '2026-03-31' });
    });

    it('keeps the custom dates of a custom range', function() {
      const filters = { ...DEFAULTS, range: 'custom', from: '2026-01-01', to: '2026-01-10' };

      expect(StaffStatisticsFiltersController.initialState(filters))
        .toEqual({ rangeDraft: 'custom', customFrom: '2026-01-01', customTo: '2026-01-10' });
    });
  });

  describe('#buildDomainsEffect', function() {
    it('fetches the domains', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: [{ id: 1, domain: 'a' }] }));

      controller.buildDomainsEffect()();
      await flushMicrotasks();

      expect(setters.setDomains).toHaveBeenCalledWith([{ id: 1, domain: 'a' }]);
    });

    it('drops a response arriving after cleanup', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: [] }));

      controller.buildDomainsEffect()()();
      await flushMicrotasks();

      expect(setters.setDomains).not.toHaveBeenCalled();
    });
  });

  describe('#fetchDomains', function() {
    it('sets the fetched domains', async function() {
      const domains = [{ id: 1, domain: 'a.example' }];
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: domains }));

      await controller.fetchDomains();

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'StaffStatisticsFilterBar',
        resource: 'staffStatistics',
        quantityType: 'domains',
      });
      expect(setters.setDomains).toHaveBeenCalledWith(domains);
    });

    it('sets an empty list for a non-array payload', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: null }));

      await controller.fetchDomains();

      expect(setters.setDomains).toHaveBeenCalledWith([]);
    });

    it('sets an empty list on failure', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));

      await controller.fetchDomains();

      expect(setters.setDomains).toHaveBeenCalledWith([]);
    });

    it('does not set the domains once inactive', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: [] }));

      await controller.fetchDomains(() => false);
      await flushMicrotasks();

      expect(setters.setDomains).not.toHaveBeenCalled();
    });
  });

  describe('#handleRangeChange', function() {
    it('applies a preset at once', function() {
      const filters = { ...DEFAULTS, range: 'custom', from: '2026-01-01', to: '2026-01-10', audience: 'anonymous' };

      controller.handleRangeChange(filters, '90d');

      expect(setters.setRangeDraft).toHaveBeenCalledWith('90d');
      expect(navigate).toHaveBeenCalledWith(`${tabPath}?range=90d&audience=anonymous`);
    });

    it('only reveals the custom inputs for custom', function() {
      controller.handleRangeChange({ ...DEFAULTS }, 'custom');

      expect(setters.setRangeDraft).toHaveBeenCalledWith('custom');
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('#handleCustomDateChange', function() {
    const draft = { from: '2026-01-01', to: '2026-01-31' };

    it('applies a valid custom pair', function() {
      controller.handleCustomDateChange({ ...DEFAULTS }, draft, 'to', '2026-02-15');

      expect(setters.setCustomTo).toHaveBeenCalledWith('2026-02-15');
      expect(navigate).toHaveBeenCalledWith(`${tabPath}?range=custom&from=2026-01-01&to=2026-02-15`);
    });

    it('updates the from input', function() {
      controller.handleCustomDateChange({ ...DEFAULTS }, draft, 'from', '2026-01-05');

      expect(setters.setCustomFrom).toHaveBeenCalledWith('2026-01-05');
      expect(navigate).toHaveBeenCalledWith(`${tabPath}?range=custom&from=2026-01-05&to=2026-01-31`);
    });

    it('does not apply an incomplete date', function() {
      controller.handleCustomDateChange({ ...DEFAULTS }, draft, 'from', '');

      expect(setters.setCustomFrom).toHaveBeenCalledWith('');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not apply from after to', function() {
      controller.handleCustomDateChange({ ...DEFAULTS }, draft, 'from', '2026-02-01');

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('#handleChange', function() {
    it('applies a single filter', function() {
      controller.handleChange({ ...DEFAULTS, range: '7d' }, 'domain', 'unknown');

      expect(navigate).toHaveBeenCalledWith(`${tabPath}?range=7d&domain=unknown`);
    });

    it('treats an empty value as any', function() {
      controller.handleChange({ ...DEFAULTS, domain: '3' }, 'domain', '');

      expect(navigate).toHaveBeenCalledWith(tabPath);
    });

    it('clears the user with null', function() {
      controller.handleChange({ ...DEFAULTS, user: '3' }, 'user', null);

      expect(navigate).toHaveBeenCalledWith(tabPath);
    });
  });

  describe('#handleReset', function() {
    it('navigates to the bare tab path', function() {
      controller.handleReset();

      expect(navigate).toHaveBeenCalledWith(tabPath);
    });
  });

  describe('default navigation', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('sets the window hash', function() {
      globalThis.window = { location: { hash: '' } };

      new StaffStatisticsFiltersController({ tabPath, ...setters }).handleReset();

      expect(globalThis.window.location.hash).toBe(tabPath);
    });

    it('does nothing without a window', function() {
      globalThis.window = undefined;

      expect(() => new StaffStatisticsFiltersController({ tabPath, ...setters }).handleReset()).not.toThrow();
    });
  });
});
