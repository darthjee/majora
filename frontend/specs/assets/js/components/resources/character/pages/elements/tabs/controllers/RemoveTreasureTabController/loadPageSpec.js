import RemoveTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveTreasureTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('RemoveTreasureTabController', function() {
  describe('#loadPage', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });

    it('sets loading true before fetching', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new RemoveTreasureTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(1, character, '', setBrowse);

      const [firstUpdater] = setBrowse.calls.argsFor(0);

      expect(firstUpdater({ items: [], page: 1, pages: 1, loading: false, error: 'old' })).toEqual({
        items: [], page: 1, pages: 1, loading: true, error: '',
      });
    });

    it('fetches through RequestStore and applies the resulting items/pagination on success', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2 }], pagination: { page: 2, pages: 4, perPage: 10 },
      }));
      const controller = new RemoveTreasureTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(2, character, 'ring', setBrowse);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'RemoveTreasureTabController',
        resource: 'treasure',
        quantityType: 'ownedCollection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 2, per_page: 10, name: 'ring' },
      });
      expect(setBrowse).toHaveBeenCalledWith({
        items: [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2 }], page: 2, pages: 4, loading: false, error: '',
      });
    });

    it('sets a load error when the RequestStore fetch rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new RemoveTreasureTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(1, character, '', setBrowse);

      const [, errorUpdater] = setBrowse.calls.allArgs().map((args) => args[0]);

      expect(errorUpdater({ items: [], page: 1, pages: 1, loading: true, error: '' })).toEqual({
        items: [], page: 1, pages: 1, loading: false, error: 'treasure_exchange_modal.load_error',
      });
    });
  });
});
