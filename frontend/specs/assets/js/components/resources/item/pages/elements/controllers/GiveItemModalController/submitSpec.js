import GiveItemModalController
  from '../../../../../../../../../../assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../../assets/js/utils/Noop.js';

describe('GiveItemModalController', function() {
  describe('#submit', function() {
    const rowA = {
      character: { id: 1, name: 'Aria' }, kind: 'pcs', ownedQuantity: 0, pendingQuantity: 2, result: null,
    };
    const rowB = {
      character: { id: 2, name: 'Grak' }, kind: 'npcs', ownedQuantity: 1, pendingQuantity: 1, result: null,
    };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setReceiving: jasmine.createSpy('setReceiving'),
    });

    it('sets submitting true before any request settles', function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'acquire').and.returnValue(new Promise(Noop.noop));
      const setters = buildSetters();

      controller.submit([rowA], 'demo', 9, false, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('fires one acquire call per pending unit for every listed character', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      spyOn(RequestStore, 'purge');

      await controller.submit([rowA, rowB], 'demo', 9, true, true, buildSetters());

      expect(controller.acquire).toHaveBeenCalledTimes(3);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 1, 'pcs', 9, true, true);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 2, 'npcs', 9, true, true);
    });

    it('purges the item cache and refetches the summary for every character, even on failure', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(false));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      spyOn(RequestStore, 'purge');

      await controller.submit([rowA], 'demo', 9, false, false, buildSetters());

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'item' });
      expect(controller.fetchSummary).toHaveBeenCalledWith('demo', 9, 'pcs', 1);
    });

    it('marks a row as success only when every pending unit succeeded', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'acquire').and.returnValues(Promise.resolve(true), Promise.resolve(false));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(1));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        { ...rowA, ownedQuantity: 1, result: 'failure' },
      ]);
    });

    it('marks a row as success when every pending unit succeeded', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(2));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        { ...rowA, ownedQuantity: 2, result: 'success' },
      ]);
    });

    it('clears submitting once every acquire call and summary refetch has settled', async function() {
      const controller = new GiveItemModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA, rowB], 'demo', 9, false, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
    });
  });
});
