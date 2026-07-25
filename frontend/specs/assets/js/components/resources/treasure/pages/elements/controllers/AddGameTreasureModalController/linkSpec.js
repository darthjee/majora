import AddGameTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/AddGameTreasureModalController.js';
import RequestStore
  from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('AddGameTreasureModalController', function() {
  describe('#link', function() {
    it('returns ok with the created treasure detail on success', async function() {
      const mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {
        id: 5, name: 'Sword', value: 100,
      })));
      const controller = new AddGameTreasureModalController();

      const fields = {
        treasure_id: 5, value: 100, hidden: false, max_units: null,
      };
      const result = await controller.link('demo', fields);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'AddGameTreasureModalController',
        resource: 'treasure',
        method: 'POST',
        quantityType: 'link',
        params: { gameSlug: 'demo' },
        body: fields,
      });
      expect(result).toEqual({ ok: true, treasure: { id: 5, name: 'Sword', value: 100 } });
    });

    it('returns an error key on a non-2xx response', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { treasure_id: ['invalid'] } }))
      );
      const controller = new AddGameTreasureModalController();

      const result = await controller.link('demo', {
        treasure_id: 5, value: 100, hidden: false, max_units: null,
      });

      expect(result).toEqual({ ok: false, errorKey: 'add_game_treasure_modal.save_error' });
    });

    it('falls back to an empty body when the response cannot be parsed as JSON', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('bad json')),
        headers: { get: () => null },
      }));
      const controller = new AddGameTreasureModalController();

      const result = await controller.link('demo', {
        treasure_id: 5, value: 100, hidden: false, max_units: null,
      });

      expect(result).toEqual({ ok: false, errorKey: 'add_game_treasure_modal.save_error' });
    });
  });
});
