import RemoveDocumentTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveDocumentTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';

describe('RemoveDocumentTabController', function() {
  describe('#remove', function() {
    it('returns ok on success', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveDocumentTabController();

      const result = await controller.remove('demo', 7, true, { gameDocumentId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'RemoveDocumentTabController',
        resource: 'document',
        method: 'POST',
        quantityType: 'remove',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { game_document_id: 9 },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveDocumentTabController();

      await controller.remove('demo', 7, false, { gameDocumentId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('returns a generic error on failure', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(404)));
      const controller = new RemoveDocumentTabController();

      const result = await controller.remove('demo', 7, true, { gameDocumentId: 9 });

      expect(result).toEqual({ ok: false, errorKey: 'document_exchange_modal.generic_error' });
    });

    it('passes the private variant when canEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveDocumentTabController();

      await controller.remove('demo', 7, true, { gameDocumentId: 9 }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });

    it('passes the regular variant when canEdit is omitted', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveDocumentTabController();

      await controller.remove('demo', 7, true, { gameDocumentId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'regular' }));
    });
  });
});
