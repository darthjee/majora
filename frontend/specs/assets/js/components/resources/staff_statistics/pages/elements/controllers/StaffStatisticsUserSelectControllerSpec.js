import StaffStatisticsUserSelectController, { USER_SEARCH_DEBOUNCE_MS }
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/controllers/StaffStatisticsUserSelectController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import flushMicrotasks from '../../../../../../../../support/flushMicrotasks.js';

describe('StaffStatisticsUserSelectController', function() {
  let setResults;
  let setSearched;
  let setSelected;
  let controller;
  let ensureSpy;

  beforeEach(function() {
    setResults = jasmine.createSpy('setResults');
    setSearched = jasmine.createSpy('setSearched');
    setSelected = jasmine.createSpy('setSelected');
    controller = new StaffStatisticsUserSelectController({ setResults, setSearched, setSelected });
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  describe('#buildSearchEffect', function() {
    beforeEach(function() {
      jasmine.clock().install();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('clears the results for a blank term', function() {
      const cleanup = controller.buildSearchEffect('   ')();

      expect(setResults).toHaveBeenCalledWith([]);
      expect(setSearched).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();
      cleanup();
    });

    it('searches after the debounce delay', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [{ id: 1, name: 'jane' }] }));

      controller.buildSearchEffect(' jane ')();
      expect(ensureSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(USER_SEARCH_DEBOUNCE_MS);
      await flushMicrotasks();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffStatisticsUserSelect',
        resource: 'staffUser',
        quantityType: 'collection',
        query: { search: 'jane' },
      });
      expect(setResults).toHaveBeenCalledWith([{ id: 1, name: 'jane' }]);
      expect(setSearched).toHaveBeenCalledWith(true);
    });

    it('cancels a pending search on cleanup', function() {
      const cleanup = controller.buildSearchEffect('jane')();
      cleanup();
      jasmine.clock().tick(USER_SEARCH_DEBOUNCE_MS);

      expect(ensureSpy).not.toHaveBeenCalled();
    });
  });

  describe('#search', function() {
    it('sets an empty list on failure', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('boom')));

      await controller.search('jane');

      expect(setResults).toHaveBeenCalledWith([]);
      expect(setSearched).toHaveBeenCalledWith(true);
    });

    it('sets an empty list for a non-array payload', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: {} }));

      await controller.search('jane');

      expect(setResults).toHaveBeenCalledWith([]);
    });

    it('ignores stale results', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [] }));

      await controller.search('jane', () => false);

      expect(setResults).not.toHaveBeenCalled();
      expect(setSearched).not.toHaveBeenCalled();
    });
  });

  describe('#buildSelectedEffect', function() {
    it('clears the selection without a user', function() {
      controller.buildSelectedEffect(null)()();

      expect(setSelected).toHaveBeenCalledWith(null);
      expect(ensureSpy).not.toHaveBeenCalled();
    });

    it('resolves the user label', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: { id: 5, name: 'jane' } }));

      controller.buildSelectedEffect('5')();
      await flushMicrotasks();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StaffStatisticsUserSelect',
        resource: 'staffUser',
        quantityType: 'single',
        params: { id: '5' },
      });
      expect(setSelected).toHaveBeenCalledWith({ id: '5', name: 'jane', deleted: false });
    });

    it('flags a user that cannot be loaded as deleted', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('request failed')));

      controller.buildSelectedEffect('5')();
      await flushMicrotasks();

      expect(setSelected).toHaveBeenCalledWith({ id: '5', name: null, deleted: true });
    });

    it('ignores a stale label after cleanup', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null }));

      controller.buildSelectedEffect('5')()();
      await flushMicrotasks();

      expect(setSelected).not.toHaveBeenCalled();
    });
  });

  describe('#resolveSelected', function() {
    it('keeps a missing name as null', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: null }));

      await controller.resolveSelected('5');

      expect(setSelected).toHaveBeenCalledWith({ id: '5', name: null, deleted: false });
    });
  });
});
