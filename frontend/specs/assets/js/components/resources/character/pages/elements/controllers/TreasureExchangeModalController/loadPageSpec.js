import TreasureExchangeModalController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import { buildClients, buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../support/factories.js';

describe('TreasureExchangeModalController', function() {
  describe('#loadPage', function() {
    const character = buildCharacter({
      id: 7, game_slug: 'demo', is_pc: true, money: 500,
    });

    it('sets loading true before fetching', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(
        Promise.resolve(buildResponse(200, [], { page: '1', pages: '1', per_page: '10' }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage('acquire', 1, character, '', setBrowse);

      const [firstUpdater] = setBrowse.calls.argsFor(0);

      expect(firstUpdater({ items: [], page: 1, pages: 1, loading: false, error: 'old' })).toEqual({
        items: [], page: 1, pages: 1, loading: true, error: '',
      });
    });

    it('fetches the acquire page and applies the resulting items/pagination on success', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, name: 'Sword' }], { page: '2', pages: '4', per_page: '10' })
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage('acquire', 2, character, 'sword', setBrowse);

      expect(treasureClient.fetchGameTreasuresPage).toHaveBeenCalledWith(
        'demo', null, {
          page: 2, perPage: 10, maxValue: 500, search: 'sword', ordering: 'desc',
        }
      );
      expect(setBrowse).toHaveBeenCalledWith({
        items: [{ id: 1, name: 'Sword' }], page: 2, pages: 4, loading: false, error: '',
      });
    });

    it('fetches the sell page for the sell tab', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.fetchTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [], { page: '1', pages: '1', per_page: '10' })
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage('sell', 1, character, '', setBrowse);

      expect(characterClient.fetchTreasuresPage).toHaveBeenCalledWith(
        'pcs', 'demo', 7, null, { page: 1, perPage: 10, search: '' }
      );
    });

    it('sets a load error when the fetch rejects', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(Promise.resolve(buildResponse(500, {})));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage('acquire', 1, character, '', setBrowse);

      const [, errorUpdater] = setBrowse.calls.allArgs().map((args) => args[0]);

      expect(errorUpdater({ items: [], page: 1, pages: 1, loading: true, error: '' })).toEqual({
        items: [], page: 1, pages: 1, loading: false, error: 'treasure_exchange_modal.load_error',
      });
    });

    it('routes the acquire fetch through the all endpoint when canEdit is true', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresAllPage.and.returnValue(Promise.resolve(
        buildResponse(200, [], { page: '1', pages: '1', per_page: '10' })
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);
      const setBrowse = jasmine.createSpy('setBrowse');
      const editorCharacter = { ...character, canEdit: true };

      await controller.loadPage('acquire', 1, editorCharacter, '', setBrowse);

      expect(treasureClient.fetchGameTreasuresAllPage).toHaveBeenCalled();
      expect(treasureClient.fetchGameTreasuresPage).not.toHaveBeenCalled();
    });
  });
});
