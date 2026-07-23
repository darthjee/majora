import AcquireTreasureTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireTreasureTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('AcquireTreasureTabController', function() {
  describe('#loadPage', function() {
    const character = buildCharacter({
      id: 7, game_slug: 'demo', is_pc: true, money: 500,
    });

    it('sets loading true before fetching', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new AcquireTreasureTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(1, character, '', setBrowse);

      const [firstUpdater] = setBrowse.calls.argsFor(0);

      expect(firstUpdater({ items: [], page: 1, pages: 1, loading: false, error: 'old' })).toEqual({
        items: [], page: 1, pages: 1, loading: true, error: '',
      });
    });

    it('fetches through RequestStore and applies the resulting items/pagination on success', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Sword' }], pagination: { page: 2, pages: 4, perPage: 10 },
      }));
      const controller = new AcquireTreasureTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(2, character, 'sword', setBrowse);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'AcquireTreasureTabController',
        resource: 'treasure',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'game' },
        query: {
          page: 2, per_page: 10, name: 'sword', ordering: 'desc',
        },
      });
      expect(setBrowse).toHaveBeenCalledWith({
        items: [{ id: 1, name: 'Sword' }], page: 2, pages: 4, loading: false, error: '',
      });
    });

    it('sets a load error when the RequestStore fetch rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new AcquireTreasureTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(1, character, '', setBrowse);

      const [, errorUpdater] = setBrowse.calls.allArgs().map((args) => args[0]);

      expect(errorUpdater({ items: [], page: 1, pages: 1, loading: true, error: '' })).toEqual({
        items: [], page: 1, pages: 1, loading: false, error: 'treasure_exchange_modal.load_error',
      });
    });

    it('lets RequestStore resolve the endpoint variant regardless of the character.canEdit flag', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new AcquireTreasureTabController();
      const setBrowse = jasmine.createSpy('setBrowse');
      const editorCharacter = { ...character, canEdit: true };

      await controller.loadPage(1, editorCharacter, '', setBrowse);

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'game' },
      }));
    });
  });
});
