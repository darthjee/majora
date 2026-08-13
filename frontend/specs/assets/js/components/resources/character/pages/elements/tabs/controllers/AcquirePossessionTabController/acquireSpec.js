import AcquirePossessionTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquirePossessionTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('AcquirePossessionTabController', function() {
  describe('#acquire', function() {
    it('returns ok with the acquired CharacterPossession on success', async function() {
      const characterPossession = {
        id: 3, game_possession_id: 9, name: 'Old Tavern', photo_path: null, description: '', hidden: false,
      };
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, characterPossession)));
      const controller = new AcquirePossessionTabController();

      const result = await controller.acquire('demo', 7, true, { gamePossessionId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'AcquirePossessionTabController',
        resource: 'possession',
        method: 'POST',
        quantityType: 'acquire',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { game_possession_id: 9, hidden: false },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true, characterPossession });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquirePossessionTabController();

      await controller.acquire('demo', 7, false, { gamePossessionId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('returns the already-owned error key when the game possession is already owned', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_possession_id: ['game_possession_already_owned'] } })),
      );
      const controller = new AcquirePossessionTabController();

      const result = await controller.acquire('demo', 7, true, { gamePossessionId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'possession_exchange_modal.already_owned_error' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_possession_id: ['something else'] } })),
      );
      const controller = new AcquirePossessionTabController();

      const result = await controller.acquire('demo', 7, true, { gamePossessionId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'possession_exchange_modal.generic_error' });
    });

    it('passes the private variant when gameCanEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquirePossessionTabController();

      await controller.acquire('demo', 7, true, { gamePossessionId: 9, hidden: true }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });

    it('passes the regular variant when gameCanEdit is omitted', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquirePossessionTabController();

      await controller.acquire('demo', 7, true, { gamePossessionId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });
  });
});
