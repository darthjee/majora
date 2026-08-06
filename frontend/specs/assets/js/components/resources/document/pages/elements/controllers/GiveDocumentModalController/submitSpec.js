import GiveDocumentModalController
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GiveDocumentModalController', function() {
  describe('#submit', function() {
    const rowA = {
      character: { id: 1, name: 'Aria' }, kind: 'pcs', owned: false, result: null,
    };
    const rowB = {
      character: { id: 2, name: 'Grak' }, kind: 'npcs', owned: false, result: null,
    };
    const ownedRow = {
      character: { id: 3, name: 'Borin' }, kind: 'pcs', owned: true, result: null,
    };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setReceiving: jasmine.createSpy('setReceiving'),
    });

    it('sets submitting true before any request settles', function() {
      const controller = new GiveDocumentModalController();
      // eslint-disable-next-line no-empty-function
      spyOn(controller, 'acquire').and.returnValue(new Promise(() => {}));
      const setters = buildSetters();

      controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('fires a single acquire call per non-owned listed character', async function() {
      const controller = new GiveDocumentModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');

      await controller.submit([rowA, rowB], 'demo', 9, true, buildSetters());

      expect(controller.acquire).toHaveBeenCalledTimes(2);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 1, 'pcs', 9, true);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 2, 'npcs', 9, true);
    });

    it('skips already-owned rows entirely, never calling acquire or fetchSummary for them', async function() {
      const controller = new GiveDocumentModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');

      await controller.submit([ownedRow], 'demo', 9, false, buildSetters());

      expect(controller.acquire).not.toHaveBeenCalled();
      expect(controller.fetchSummary).not.toHaveBeenCalled();
    });

    it('leaves already-owned rows untouched in the resulting receiving list', async function() {
      const controller = new GiveDocumentModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(false));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([ownedRow, rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        ownedRow,
        { ...rowA, owned: false, result: 'success' },
      ]);
    });

    it('purges the document cache and refetches the summary for every non-owned character, even on failure',
      async function() {
        const controller = new GiveDocumentModalController();
        spyOn(controller, 'acquire').and.returnValue(Promise.resolve(false));
        spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(false));
        spyOn(RequestStore, 'purge');

        await controller.submit([rowA], 'demo', 9, false, buildSetters());

        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
        expect(controller.fetchSummary).toHaveBeenCalledWith('demo', 9, 'pcs', 1);
      });

    it('marks a row as failure when the acquire call fails', async function() {
      const controller = new GiveDocumentModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(false));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(false));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        { ...rowA, owned: false, result: 'failure' },
      ]);
    });

    it('marks a row as success and owned when the acquire call succeeds', async function() {
      const controller = new GiveDocumentModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        { ...rowA, owned: true, result: 'success' },
      ]);
    });

    it('clears submitting once every acquire call and summary refetch has settled', async function() {
      const controller = new GiveDocumentModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA, rowB], 'demo', 9, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
    });
  });
});
