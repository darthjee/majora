import AcquireDocumentTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireDocumentTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('AcquireDocumentTabController', function() {
  describe('#confirmAcquire', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });
    const selected = { id: 9, name: 'Map', photo_path: '/map.png', hidden: false };

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
      const controller = new AcquireDocumentTabController();
      const setters = buildSetters();

      controller.confirmAcquire(selected, false, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('acquires the selected game document id with the given hidden value', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquireDocumentTabController();
      const setters = buildSetters();

      await controller.confirmAcquire(selected, true, character, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { game_document_id: 9, hidden: true },
      }));
    });

    it('applies the success outcome: purges the document cache, clears selection, notifies onSuccess, and reloads',
      async function() {
        spyOn(RequestStore, 'purge');
        const characterDocument = { id: 3, game_document_id: 9, name: 'Map', hidden: false };
        spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, characterDocument)));
        const controller = new AcquireDocumentTabController();
        const setters = buildSetters();

        await controller.confirmAcquire(selected, false, character, setters);

        expect(setters.setSubmitting).toHaveBeenCalledWith(false);
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'document' });
        expect(setters.setSelected).toHaveBeenCalledWith(null);
        expect(setters.onSuccess).toHaveBeenCalledWith({ gameDocumentId: 9, characterDocument });
        expect(setters.reload).toHaveBeenCalled();
      });

    it('surfaces the error key, does not purge, and does not reload on a validation failure', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_document_id: ['already owned'] } })),
      );
      const controller = new AcquireDocumentTabController();
      const setters = buildSetters();

      await controller.confirmAcquire(selected, false, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('document_exchange_modal.already_owned_error');
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character gameCanEdit flag through to the acquire request', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquireDocumentTabController();
      const setters = buildSetters();
      const editorCharacter = { ...character, gameCanEdit: true };

      await controller.confirmAcquire(selected, true, editorCharacter, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });
  });
});
