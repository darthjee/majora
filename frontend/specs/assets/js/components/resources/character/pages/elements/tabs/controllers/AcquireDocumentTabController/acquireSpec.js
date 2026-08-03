import AcquireDocumentTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireDocumentTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('AcquireDocumentTabController', function() {
  describe('#acquire', function() {
    it('returns ok with the acquired CharacterDocument on success', async function() {
      const characterDocument = {
        id: 3, game_document_id: 9, name: 'Map', photo_path: null, description: '', hidden: false,
      };
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, characterDocument)));
      const controller = new AcquireDocumentTabController();

      const result = await controller.acquire('demo', 7, true, { gameDocumentId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'AcquireDocumentTabController',
        resource: 'document',
        method: 'POST',
        quantityType: 'acquire',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { game_document_id: 9, hidden: false },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true, characterDocument });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireDocumentTabController();

      await controller.acquire('demo', 7, false, { gameDocumentId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('returns the already-owned error key when the game document is already owned', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_document_id: ['already owned'] } })),
      );
      const controller = new AcquireDocumentTabController();

      const result = await controller.acquire('demo', 7, true, { gameDocumentId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'document_exchange_modal.already_owned_error' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_document_id: ['something else'] } })),
      );
      const controller = new AcquireDocumentTabController();

      const result = await controller.acquire('demo', 7, true, { gameDocumentId: 9, hidden: false });

      expect(result).toEqual({ ok: false, errorKey: 'document_exchange_modal.generic_error' });
    });

    it('passes the private variant when gameCanEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireDocumentTabController();

      await controller.acquire('demo', 7, true, { gameDocumentId: 9, hidden: true }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });

    it('passes the regular variant when gameCanEdit is omitted', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireDocumentTabController();

      await controller.acquire('demo', 7, true, { gameDocumentId: 9, hidden: false });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });
  });
});
