import StatisticsUsersTableController
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/controllers/StatisticsUsersTableController.js';

describe('StatisticsUsersTableController', function() {
  const filters = {
    range: '7d', from: null, to: null, granularity: 'week', user: null, domain: '3', audience: 'all',
  };
  const row = { id: 5 };
  let navigate;
  let controller;

  beforeEach(function() {
    navigate = jasmine.createSpy('navigate');
    controller = new StatisticsUsersTableController({ filters, navigate });
  });

  describe('#rowHref', function() {
    it('links to the Overview tab filtered by the user, keeping the filters', function() {
      expect(controller.rowHref(row)).toBe('/staff/statistics?range=7d&granularity=week&user=5&domain=3');
    });

    it('replaces a current user filter', function() {
      const other = new StatisticsUsersTableController({ filters: { ...filters, user: '9' }, navigate });

      expect(other.rowHref(row)).toBe('/staff/statistics?range=7d&granularity=week&user=5&domain=3');
    });
  });

  describe('#openRow', function() {
    it('navigates to the row href', function() {
      controller.openRow(row);

      expect(navigate).toHaveBeenCalledWith(controller.rowHref(row));
    });
  });

  describe('#handleRowKeyDown', function() {
    const keyEvent = (key, nested = false) => {
      const currentTarget = {};
      return {
        key,
        currentTarget,
        target: nested ? {} : currentTarget,
        preventDefault: jasmine.createSpy('preventDefault'),
      };
    };

    ['Enter', ' '].forEach((key) => {
      it(`opens the row on "${key}"`, function() {
        const event = keyEvent(key);
        controller.handleRowKeyDown(event, row);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(navigate).toHaveBeenCalledWith(controller.rowHref(row));
      });
    });

    it('ignores other keys', function() {
      const event = keyEvent('a');
      controller.handleRowKeyDown(event, row);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('ignores keys from a nested element', function() {
      const event = keyEvent('Enter', true);
      controller.handleRowKeyDown(event, row);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('default navigation', function() {
    afterEach(function() {
      delete globalThis.window;
    });

    it('sets the window hash', function() {
      globalThis.window = { location: { hash: '' } };
      new StatisticsUsersTableController({ filters }).openRow(row);

      expect(globalThis.window.location.hash).toBe('/staff/statistics?range=7d&granularity=week&user=5&domain=3');
    });

    it('does nothing outside a browser', function() {
      expect(() => new StatisticsUsersTableController({ filters }).openRow(row)).not.toThrow();
    });
  });
});
