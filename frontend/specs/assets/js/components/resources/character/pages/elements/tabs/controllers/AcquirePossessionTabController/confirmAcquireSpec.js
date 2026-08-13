import AcquirePossessionTabController
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquirePossessionTabController.js';
import RequestStore
  from '../../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildResponse } from './support.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('AcquirePossessionTabController', function() {
  describe('#confirmAcquire', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });
    const selected = { id: 9, name: 'Old Tavern', photo_path: '/tavern.png', hidden: false };

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
      const controller = new AcquirePossessionTabController();
      const setters = buildSetters();

      controller.confirmAcquire(selected, false, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('acquires the selected game possession id with the given hidden value', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquirePossessionTabController();
      const setters = buildSetters();

      await controller.confirmAcquire(selected, true, character, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        body: { game_possession_id: 9, hidden: true },
      }));
    });

    it('applies the success outcome: purges the possession cache, clears selection, notifies onSuccess, and reloads',
      async function() {
        spyOn(RequestStore, 'purge');
        const characterPossession = { id: 3, game_possession_id: 9, name: 'Old Tavern', hidden: false };
        spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, characterPossession)));
        const controller = new AcquirePossessionTabController();
        const setters = buildSetters();

        await controller.confirmAcquire(selected, false, character, setters);

        expect(setters.setSubmitting).toHaveBeenCalledWith(false);
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'possession' });
        expect(setters.setSelected).toHaveBeenCalledWith(null);
        expect(setters.onSuccess).toHaveBeenCalledWith({ gamePossessionId: 9, characterPossession });
        expect(setters.reload).toHaveBeenCalled();
      });

    it('surfaces the error key, does not purge, and does not reload on a validation failure', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_possession_id: ['game_possession_already_owned'] } })),
      );
      const controller = new AcquirePossessionTabController();
      const setters = buildSetters();

      await controller.confirmAcquire(selected, false, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('possession_exchange_modal.already_owned_error');
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character gameCanEdit flag through to the acquire request', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquirePossessionTabController();
      const setters = buildSetters();
      const editorCharacter = { ...character, gameCanEdit: true };

      await controller.confirmAcquire(selected, true, editorCharacter, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });
  });
});
