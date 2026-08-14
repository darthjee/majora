import RecruitModalController
  from '../../../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/RecruitModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('RecruitModalController', function() {
  describe('#submit', function() {
    const rowA = {
      character: { id: 1, name: 'Aria' }, kind: 'pcs', enlisted: false, result: null,
    };
    const rowB = {
      character: { id: 2, name: 'Grak' }, kind: 'npcs', enlisted: false, result: null,
    };
    const enlistedRow = {
      character: { id: 3, name: 'Borin' }, kind: 'pcs', enlisted: true, result: null,
    };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setReceiving: jasmine.createSpy('setReceiving'),
    });

    it('sets submitting true before any request settles', function() {
      const controller = new RecruitModalController();
      // eslint-disable-next-line no-empty-function
      spyOn(controller, 'acquire').and.returnValue(new Promise(() => {}));
      const setters = buildSetters();

      controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('fires a single acquire call per non-enlisted listed character', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');

      await controller.submit([rowA, rowB], 'demo', 9, true, buildSetters());

      expect(controller.acquire).toHaveBeenCalledTimes(2);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 1, 'pcs', 9, true);
      expect(controller.acquire).toHaveBeenCalledWith('demo', 2, 'npcs', 9, true);
    });

    it('skips already-enlisted rows entirely, never calling acquire or fetchSummary for them', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');

      await controller.submit([enlistedRow], 'demo', 9, false, buildSetters());

      expect(controller.acquire).not.toHaveBeenCalled();
      expect(controller.fetchSummary).not.toHaveBeenCalled();
    });

    it('leaves already-enlisted rows untouched in the resulting receiving list', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(false));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([enlistedRow, rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        enlistedRow,
        { ...rowA, enlisted: false, result: 'success' },
      ]);
    });

    it('purges the faction cache and refetches the summary for every non-enlisted character, even on failure',
      async function() {
        const controller = new RecruitModalController();
        spyOn(controller, 'acquire').and.returnValue(Promise.resolve(false));
        spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(false));
        spyOn(RequestStore, 'purge');

        await controller.submit([rowA], 'demo', 9, false, buildSetters());

        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'faction' });
        expect(controller.fetchSummary).toHaveBeenCalledWith('demo', 9, 'pcs', 1);
      });

    it('marks a row as failure when the acquire call fails', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(false));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(false));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        { ...rowA, enlisted: false, result: 'failure' },
      ]);
    });

    it('marks a row as success and enlisted when the acquire call succeeds', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA], 'demo', 9, false, setters);

      expect(setters.setReceiving).toHaveBeenCalledWith([
        { ...rowA, enlisted: true, result: 'success' },
      ]);
    });

    it('clears submitting once every acquire call and summary refetch has settled', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'acquire').and.returnValue(Promise.resolve(true));
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await controller.submit([rowA, rowB], 'demo', 9, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
    });
  });
});
