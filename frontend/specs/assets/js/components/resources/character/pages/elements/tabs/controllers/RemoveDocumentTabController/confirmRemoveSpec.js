import RemoveDocumentTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveDocumentTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('RemoveDocumentTabController', function() {
  describe('#confirmRemove', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });
    const selected = { id: 3, game_document_id: 11, name: 'Map', photo_path: '/map.png' };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setSelected: jasmine.createSpy('setSelected'),
      setActionError: jasmine.createSpy('setActionError'),
      onSuccess: jasmine.createSpy('onSuccess'),
      reload: jasmine.createSpy('reload'),
    });

    it('sets submitting true before the request settles', function() {
      // eslint-disable-next-line no-empty-function
      spyOn(RequestStore, 'mutate').and.returnValue(new Promise(() => {}));
      const controller = new RemoveDocumentTabController();
      const setters = buildSetters();

      controller.confirmRemove(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('removes the selected owned document\'s game_document_id', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveDocumentTabController();
      const setters = buildSetters();

      await controller.confirmRemove(selected, character, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { game_document_id: 11 },
      }));
    });

    it('applies the success outcome: purges the document cache, clears selection, notifies onSuccess, and reloads',
      async function() {
        spyOn(RequestStore, 'purge');
        spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
        const controller = new RemoveDocumentTabController();
        const setters = buildSetters();

        await controller.confirmRemove(selected, character, setters);

        expect(setters.setSubmitting).toHaveBeenCalledWith(false);
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
        expect(setters.setSelected).toHaveBeenCalledWith(null);
        expect(setters.onSuccess).toHaveBeenCalledWith({ gameDocumentId: 11 });
        expect(setters.reload).toHaveBeenCalled();
      });

    it('surfaces the error key, does not purge, and does not reload on a failure', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(404)));
      const controller = new RemoveDocumentTabController();
      const setters = buildSetters();

      await controller.confirmRemove(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('document_exchange_modal.generic_error');
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character canEdit flag through to the remove request', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveDocumentTabController();
      const setters = buildSetters();
      const editorCharacter = { ...character, canEdit: true };

      await controller.confirmRemove(selected, editorCharacter, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });
  });
});
