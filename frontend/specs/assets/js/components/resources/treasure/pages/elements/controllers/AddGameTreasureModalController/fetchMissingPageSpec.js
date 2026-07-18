import AddGameTreasureModalController
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/controllers/AddGameTreasureModalController.js';
import { buildTreasureClient, buildResponse } from './support.js';

describe('AddGameTreasureModalController', function() {
  describe('#fetchMissingPage', function() {
    it('resolves data and pagination from the treasure client response', async function() {
      const treasureClient = buildTreasureClient();
      treasureClient.fetchMissingGameTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, name: 'Sword', value: 100 }], { page: '2', pages: '3', per_page: '5' })
      ));
      const controller = new AddGameTreasureModalController(treasureClient);

      const result = await controller.fetchMissingPage('demo', 'tok', { page: 2, perPage: 5 });

      expect(treasureClient.fetchMissingGameTreasuresPage).toHaveBeenCalledWith(
        'demo', 'tok', { page: 2, perPage: 5 }
      );
      expect(result).toEqual({
        data: [{ id: 1, name: 'Sword', value: 100 }],
        pagination: { page: 2, pages: 3, perPage: 5 },
      });
    });

    it('rejects when the response is not ok', async function() {
      const treasureClient = buildTreasureClient();
      treasureClient.fetchMissingGameTreasuresPage.and.returnValue(Promise.resolve(buildResponse(500, {})));
      const controller = new AddGameTreasureModalController(treasureClient);

      await expectAsync(controller.fetchMissingPage('demo', 'tok', {})).toBeRejected();
    });

    it('defaults to an empty array when the response body is not an array', async function() {
      const treasureClient = buildTreasureClient();
      treasureClient.fetchMissingGameTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, null, { page: '1', pages: '1', per_page: '10' })
      ));
      const controller = new AddGameTreasureModalController(treasureClient);

      const result = await controller.fetchMissingPage('demo', 'tok', {});

      expect(result.data).toEqual([]);
    });
  });
});
