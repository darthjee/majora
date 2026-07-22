import TreasureExchangeModalController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildClients, buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../support/factories.js';

describe('TreasureExchangeModalController', function() {
  describe('#loadPage', function() {
    const character = buildCharacter({
      id: 7, game_slug: 'demo', is_pc: true, money: 500,
    });

    it('sets loading true before fetching', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new TreasureExchangeModalController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage('acquire', 1, character, '', setBrowse);

      const [firstUpdater] = setBrowse.calls.argsFor(0);

      expect(firstUpdater({ items: [], page: 1, pages: 1, loading: false, error: 'old' })).toEqual({
        items: [], page: 1, pages: 1, loading: true, error: '',
      });
    });

    it('fetches the acquire page through RequestStore and applies the resulting items/pagination on success',
      async function() {
        const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [{ id: 1, name: 'Sword' }], pagination: { page: 2, pages: 4, perPage: 10 },
        }));
        const controller = new TreasureExchangeModalController();
        const setBrowse = jasmine.createSpy('setBrowse');

        await controller.loadPage('acquire', 2, character, 'sword', setBrowse);

        expect(ensureSpy).toHaveBeenCalledWith({
          resource: 'treasure',
          quantityType: 'collection',
          params: { gameSlug: 'demo', kind: 'game' },
          query: {
            page: 2, per_page: 10, max_value: 500, name: 'sword', ordering: 'desc',
          },
        });
        expect(setBrowse).toHaveBeenCalledWith({
          items: [{ id: 1, name: 'Sword' }], page: 2, pages: 4, loading: false, error: '',
        });
      });

    it('fetches the sell page for the sell tab, unaffected by RequestStore', async function() {
      const { characterClient } = buildClients();
      characterClient.fetchTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [], { page: '1', pages: '1', per_page: '10' })
      ));
      const controller = new TreasureExchangeModalController(characterClient);
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage('sell', 1, character, '', setBrowse);

      expect(characterClient.fetchTreasuresPage).toHaveBeenCalledWith(
        'pcs', 'demo', 7, null, { page: 1, perPage: 10, search: '' }
      );
    });

    it('sets a load error when the RequestStore fetch rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new TreasureExchangeModalController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage('acquire', 1, character, '', setBrowse);

      const [, errorUpdater] = setBrowse.calls.allArgs().map((args) => args[0]);

      expect(errorUpdater({ items: [], page: 1, pages: 1, loading: true, error: '' })).toEqual({
        items: [], page: 1, pages: 1, loading: false, error: 'treasure_exchange_modal.load_error',
      });
    });

    it('lets RequestStore resolve the acquire endpoint variant regardless of the character.canEdit flag',
      async function() {
        const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        const controller = new TreasureExchangeModalController();
        const setBrowse = jasmine.createSpy('setBrowse');
        const editorCharacter = { ...character, canEdit: true };

        await controller.loadPage('acquire', 1, editorCharacter, '', setBrowse);

        // `canEdit` is no longer forwarded to RequestStore.ensure's params/query — RequestStore
        // resolves the regular/private variant itself from live permissions.
        expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
          params: { gameSlug: 'demo', kind: 'game' },
        }));
      });
  });
});
