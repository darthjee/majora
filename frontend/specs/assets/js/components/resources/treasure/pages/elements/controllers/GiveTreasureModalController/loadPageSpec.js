import GiveTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController.js';
import Noop from '../../../../../../../../../../assets/js/utils/Noop.js';

describe('GiveTreasureModalController', function() {
  describe('#loadPage', function() {
    it('sets loading true before the request settles', function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'fetchCharacterPage').and.returnValue(new Promise(Noop.noop));
      const setBrowse = jasmine.createSpy('setBrowse');

      controller.loadPage(1, 'demo', 'pcs', '', setBrowse);

      const updater = setBrowse.calls.mostRecent().args[0];
      expect(updater({ items: [], page: 1, pages: 1, loading: false, error: 'x' }))
        .toEqual({ items: [], page: 1, pages: 1, loading: true, error: '' });
    });

    it('applies the fetched page on success', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'fetchCharacterPage').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Aria' }], pagination: { page: 2, pages: 3 },
      }));
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(2, 'demo', 'pcs', 'ar', setBrowse);

      expect(controller.fetchCharacterPage).toHaveBeenCalledWith('demo', 'pcs', {
        page: 2, perPage: 10, search: 'ar',
      });
      expect(setBrowse).toHaveBeenCalledWith({
        items: [{ id: 1, name: 'Aria' }], page: 2, pages: 3, loading: false, error: '',
      });
    });

    it('sets a load error on failure', async function() {
      const controller = new GiveTreasureModalController();
      spyOn(controller, 'fetchCharacterPage').and.returnValue(Promise.reject(new Error('boom')));
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(1, 'demo', 'pcs', '', setBrowse);

      const updater = setBrowse.calls.mostRecent().args[0];
      expect(updater({ items: [], page: 1, pages: 1, loading: true, error: '' })).toEqual({
        items: [], page: 1, pages: 1, loading: false, error: 'give_treasure_modal.load_error',
      });
    });
  });
});
