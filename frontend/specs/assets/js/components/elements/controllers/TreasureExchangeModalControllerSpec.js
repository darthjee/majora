import TreasureExchangeModalController
  from '../../../../../../assets/js/components/elements/controllers/TreasureExchangeModalController.js';

describe('TreasureExchangeModalController', function() {
  const buildClients = () => ({
    characterClient: jasmine.createSpyObj('characterClient', [
      'fetchPcTreasuresPage', 'fetchNpcTreasuresPage',
      'acquirePcTreasure', 'sellPcTreasure', 'acquireNpcTreasure', 'sellNpcTreasure',
    ]),
    treasureClient: jasmine.createSpyObj('treasureClient', ['fetchGameTreasuresPage']),
  });

  const buildResponse = (status, body, headers = {}) => ({
    ok: status === 200,
    status,
    json: () => Promise.resolve(body),
    headers: { get: (key) => headers[key] ?? null },
  });

  describe('#fetchAcquirePage', function() {
    it('resolves data and pagination from the treasure client response', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, name: 'Sword', value: 100 }], { page: '2', pages: '3', per_page: '5' })
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.fetchAcquirePage('demo', 'tok', { page: 2, perPage: 5, maxValue: 500 });

      expect(treasureClient.fetchGameTreasuresPage).toHaveBeenCalledWith(
        'demo', 'tok', { page: 2, perPage: 5, maxValue: 500 }
      );
      expect(result).toEqual({
        data: [{ id: 1, name: 'Sword', value: 100 }],
        pagination: { page: 2, pages: 3, perPage: 5 },
      });
    });

    it('rejects when the response is not ok', async function() {
      const { characterClient, treasureClient } = buildClients();
      treasureClient.fetchGameTreasuresPage.and.returnValue(Promise.resolve(buildResponse(500, {})));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await expectAsync(controller.fetchAcquirePage('demo', 'tok', {})).toBeRejected();
    });
  });

  describe('#fetchSellPage', function() {
    it('uses the pc client when isPc is true', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.fetchPcTreasuresPage.and.returnValue(Promise.resolve(
        buildResponse(200, [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }])
      ));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.fetchSellPage('demo', 7, true, 'tok', { page: 1, perPage: 10 });

      expect(characterClient.fetchPcTreasuresPage).toHaveBeenCalledWith('demo', 7, 'tok', { page: 1, perPage: 10 });
      expect(result.data).toEqual([{ id: 1, treasure_id: 9, name: 'Ring', quantity: 2, value: 50 }]);
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.fetchNpcTreasuresPage.and.returnValue(Promise.resolve(buildResponse(200, [])));
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.fetchSellPage('demo', 7, false, 'tok', { page: 1, perPage: 10 });

      expect(characterClient.fetchNpcTreasuresPage).toHaveBeenCalledWith('demo', 7, 'tok', { page: 1, perPage: 10 });
    });
  });

  describe('#acquire', function() {
    it('returns ok with the new quantity and money on success', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquirePcTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 4, money: 100 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 2 });

      expect(characterClient.acquirePcTreasure).toHaveBeenCalledWith(
        'demo', 7, 'tok', { treasure_id: 9, quantity: 2 }
      );
      expect(result).toEqual({ ok: true, quantity: 4, money: 100 });
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquireNpcTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 1, money: 10 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.acquire('demo', 7, false, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.acquireNpcTreasure).toHaveBeenCalledWith(
        'demo', 7, 'tok', { treasure_id: 9, quantity: 1 }
      );
    });

    it('maps the insufficient funds error message to its translation key', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquirePcTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['insufficient funds'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 100 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.insufficient_funds' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.acquirePcTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['something else'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.acquire('demo', 7, true, 'tok', { treasureId: 9, quantity: 1 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.generic_error' });
    });
  });

  describe('#sell', function() {
    it('returns ok with the new quantity and money on success', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.sellPcTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 0, money: 600 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.sell('demo', 7, true, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.sellPcTreasure).toHaveBeenCalledWith('demo', 7, 'tok', { treasure_id: 9, quantity: 1 });
      expect(result).toEqual({ ok: true, quantity: 0, money: 600 });
    });

    it('uses the npc client when isPc is false', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.sellNpcTreasure.and.returnValue(
        Promise.resolve(buildResponse(200, { quantity: 0, money: 10 }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      await controller.sell('demo', 7, false, 'tok', { treasureId: 9, quantity: 1 });

      expect(characterClient.sellNpcTreasure).toHaveBeenCalledWith('demo', 7, 'tok', { treasure_id: 9, quantity: 1 });
    });

    it('maps the not enough owned error message to its translation key', async function() {
      const { characterClient, treasureClient } = buildClients();
      characterClient.sellPcTreasure.and.returnValue(
        Promise.resolve(buildResponse(400, { errors: { quantity: ['not enough owned'] } }))
      );
      const controller = new TreasureExchangeModalController(characterClient, treasureClient);

      const result = await controller.sell('demo', 7, true, 'tok', { treasureId: 9, quantity: 100 });

      expect(result).toEqual({ ok: false, errorKey: 'treasure_exchange_modal.not_enough_owned' });
    });
  });
});
