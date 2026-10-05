import StatisticsDomainsTableController, { DEFAULT_SORT }
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/controllers/StatisticsDomainsTableController.js';

describe('StatisticsDomainsTableController', function() {
  const filters = {
    range: '7d', from: null, to: null, granularity: 'week', user: '4', domain: null, audience: 'anonymous',
  };
  let setSort;
  let navigate;
  let controller;

  beforeEach(function() {
    setSort = jasmine.createSpy('setSort');
    navigate = jasmine.createSpy('navigate');
    controller = new StatisticsDomainsTableController({ setSort, filters, navigate });
  });

  it('defaults to no sort column, ascending', function() {
    expect(DEFAULT_SORT).toEqual({ key: null, direction: 'asc' });
  });

  describe('.nextSort', function() {
    it('sorts a new column ascending', function() {
      expect(StatisticsDomainsTableController.nextSort(DEFAULT_SORT, 'visits'))
        .toEqual({ key: 'visits', direction: 'asc' });
      expect(StatisticsDomainsTableController.nextSort({ key: 'label', direction: 'desc' }, 'visits'))
        .toEqual({ key: 'visits', direction: 'asc' });
    });

    it('flips the direction of the sorted column', function() {
      expect(StatisticsDomainsTableController.nextSort({ key: 'visits', direction: 'asc' }, 'visits'))
        .toEqual({ key: 'visits', direction: 'desc' });
      expect(StatisticsDomainsTableController.nextSort({ key: 'visits', direction: 'desc' }, 'visits'))
        .toEqual({ key: 'visits', direction: 'asc' });
    });
  });

  describe('#toggleSort', function() {
    it('updates the sort from the current one', function() {
      controller.toggleSort('visits');
      const updater = setSort.calls.mostRecent().args[0];

      expect(updater(DEFAULT_SORT)).toEqual({ key: 'visits', direction: 'asc' });
      expect(updater({ key: 'visits', direction: 'asc' })).toEqual({ key: 'visits', direction: 'desc' });
    });
  });

  describe('#rowHref', function() {
    it('links to Overview filtered by the domain id, keeping the other filters', function() {
      expect(controller.rowHref({ id: 3 }))
        .toBe('/staff/statistics?range=7d&granularity=week&user=4&domain=3&audience=anonymous');
    });

    it('links the unknown row to the unknown domain', function() {
      expect(controller.rowHref({ id: 'unknown' }))
        .toBe('/staff/statistics?range=7d&granularity=week&user=4&domain=unknown&audience=anonymous');
    });

    it('replaces a selected domain', function() {
      const scoped = new StatisticsDomainsTableController({
        setSort, filters: { ...filters, domain: '5' }, navigate,
      });

      expect(scoped.rowHref({ id: 5 })).toContain('domain=5');
    });

    it('drops default filters', function() {
      const plain = new StatisticsDomainsTableController({
        setSort,
        filters: {
          range: '30d', from: null, to: null, granularity: 'auto', user: null, domain: null, audience: 'all',
        },
        navigate,
      });

      expect(plain.rowHref({ id: 3 })).toBe('/staff/statistics?domain=3');
    });
  });

  describe('#openRow', function() {
    it('navigates to the row link', function() {
      controller.openRow({ id: 3 });

      expect(navigate).toHaveBeenCalledWith(controller.rowHref({ id: 3 }));
    });

    describe('without a navigate function', function() {
      let originalWindow;

      beforeEach(function() {
        originalWindow = globalThis.window;
      });

      afterEach(function() {
        globalThis.window = originalWindow;
      });

      it('sets the window hash', function() {
        globalThis.window = { location: { hash: '' } };
        new StatisticsDomainsTableController({ setSort, filters }).openRow({ id: 'unknown' });

        expect(globalThis.window.location.hash)
          .toBe('/staff/statistics?range=7d&granularity=week&user=4&domain=unknown&audience=anonymous');
      });

      it('does nothing without a window', function() {
        globalThis.window = undefined;

        expect(() => new StatisticsDomainsTableController({ setSort, filters }).openRow({ id: 3 })).not.toThrow();
      });
    });
  });

  describe('#handleRowKeyDown', function() {
    const eventFor = (key) => ({ key, preventDefault: jasmine.createSpy('preventDefault') });

    it('opens the row on Enter', function() {
      const event = eventFor('Enter');
      controller.handleRowKeyDown(event, { id: 3 });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(controller.rowHref({ id: 3 }));
    });

    it('opens the row on Space', function() {
      const event = eventFor(' ');
      controller.handleRowKeyDown(event, { id: 3 });

      expect(navigate).toHaveBeenCalled();
    });

    it('ignores other keys', function() {
      const event = eventFor('Tab');
      controller.handleRowKeyDown(event, { id: 3 });

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
