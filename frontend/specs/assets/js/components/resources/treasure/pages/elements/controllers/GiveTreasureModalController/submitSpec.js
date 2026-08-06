import GiveTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GiveTreasureModalController', function() {
  describe('#submit', function() {
    const rowA = {
      character: { id: 1, name: 'Aria' }, kind: 'pcs', ownedQuantity: 0, pendingQuantity: 2, result: null, partialNotice: '',
    };
    const rowB = {
      character: { id: 2, name: 'Grak' }, kind: 'npcs', ownedQuantity: 1, pendingQuantity: 1, result: null, partialNotice: '',
    };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setReceiving: jasmine.createSpy('setReceiving'),
    });

    it('sets submitting true before any request settles', function() {
      const controller = new GiveTreasureModalController();
      // eslint-disable-next-line no-empty-function
      spyOn(controller, 'acquire').and.returnValue(new Promise(() => {}));
      const setters = buildSetters();

      controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('fires a single acquire call per listed character, with the row pending quantity', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve({ ok: true, acquired: 2 }));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      spyOn(RequestStore, 'purge');

      await controller.submit([rowA, rowB], 'demo', 9, true, buildSetters());

      expect(controller.acquire).toHaveBeenCalledTimes(2);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 1, 'pcs', 9, 2, true);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 2, 'npcs', 9, 1, true);
    });

    it('purges the treasure cache and refetches the summary for every character, even on failure', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve({ ok: false, acquired: 0 }));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      spyOn(RequestStore, 'purge');

      await controller.submit([rowA], 'demo', 9, false, buildSetters());

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'treasure' });
      expect(controller.fetchSummary).toHaveBeenCalledWith('demo', 9, 'pcs', 1);
    });

    it('marks a row as failure when the acquire call fails', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve({ ok: false, acquired: 0 }));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        {
          ...rowA, ownedQuantity: 0, result: 'failure', partialNotice: '',
        },
      ]);
    });

    it('marks a row as success with no partial notice when fully fulfilled', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve({ ok: true, acquired: 2 }));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(2));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        {
          ...rowA, ownedQuantity: 2, result: 'success', partialNotice: '',
        },
      ]);
    });

    it('marks a row as success with a partial-fulfillment notice when granted fewer units than requested', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve({ ok: true, acquired: 1 }));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(1));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        {
          ...rowA,
          ownedQuantity: 1,
          result: 'success',
          partialNotice: 'Only 1 of 2 were available and were given to Aria.',
        },
      ]);
    });

    it('clears submitting once every acquire call and summary refetch has settled', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve({ ok: true, acquired: 1 }));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(0));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA, rowB], 'demo', 9, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
    });
  });
});
