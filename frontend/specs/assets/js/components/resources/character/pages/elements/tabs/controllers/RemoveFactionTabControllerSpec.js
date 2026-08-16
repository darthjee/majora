import RemoveFactionTabController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveFactionTabController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildCharacter } from '../../../../../../../../../support/factories.js';

const buildResponse = (status, body) => ({
  ok: status === 204,
  status,
  json: () => Promise.resolve(body),
});

describe('RemoveFactionTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (faction.collection)', async function() {
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, game_faction_id: 5, name: 'The Silver Hand' }], pagination,
      }));
      const controller = new RemoveFactionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, { page: 1, perPage: 10, search: '' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'RemoveFactionTabController',
        resource: 'faction',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 1, per_page: 10, name: '' },
      });
      expect(result).toEqual({ data: [{ id: 1, game_faction_id: 5, name: 'The Silver Hand' }], pagination });
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new RemoveFactionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, {});

      expect(result.data).toEqual([]);
    });
  });

  describe('#loadPage', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });

    it('fetches through RequestStore and applies the resulting items/pagination on success', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, game_faction_id: 5, name: 'The Silver Hand' }], pagination: { page: 2, pages: 4, perPage: 10 },
      }));
      const controller = new RemoveFactionTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(2, character, 'silver', setBrowse);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'RemoveFactionTabController',
        resource: 'faction',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 2, per_page: 10, name: 'silver' },
      });
      expect(setBrowse).toHaveBeenCalledWith({
        items: [{ id: 1, game_faction_id: 5, name: 'The Silver Hand' }], page: 2, pages: 4, loading: false, error: '',
      });
    });

    it('sets a load error when the RequestStore fetch rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new RemoveFactionTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(1, character, '', setBrowse);

      const [, errorUpdater] = setBrowse.calls.allArgs().map((args) => args[0]);

      expect(errorUpdater({ items: [], page: 1, pages: 1, loading: true, error: '' })).toEqual({
        items: [], page: 1, pages: 1, loading: false, error: 'faction_exchange_modal.load_error',
      });
    });

    it('resolves the npc kind when the character is not a PC', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new RemoveFactionTabController();
      const setBrowse = jasmine.createSpy('setBrowse');
      const npcCharacter = buildCharacter({ id: 7, game_slug: 'demo', is_pc: false });

      await controller.loadPage(1, npcCharacter, '', setBrowse);

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });
  });

  describe('#remove', function() {
    it('returns ok on success', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveFactionTabController();

      const result = await controller.remove('demo', 7, true, { gameFactionId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'RemoveFactionTabController',
        resource: 'faction',
        method: 'POST',
        quantityType: 'remove',
        params: {
          gameSlug: 'demo', kind: 'pcs', id: 7, factionId: 9,
        },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveFactionTabController();

      await controller.remove('demo', 7, false, { gameFactionId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: {
          gameSlug: 'demo', kind: 'npcs', id: 7, factionId: 9,
        },
      }));
    });

    it('returns a generic error on failure', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(404)));
      const controller = new RemoveFactionTabController();

      const result = await controller.remove('demo', 7, true, { gameFactionId: 9 });

      expect(result).toEqual({ ok: false, errorKey: 'faction_exchange_modal.generic_error' });
    });

    it('passes the private variant when canEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveFactionTabController();

      await controller.remove('demo', 7, true, { gameFactionId: 9 }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });
  });

  describe('#confirmRemove', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });
    const selected = { id: 3, game_faction_id: 11, name: 'The Silver Hand', photo_path: '/faction.png' };

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
      const controller = new RemoveFactionTabController();
      const setters = buildSetters();

      controller.confirmRemove(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('removes the selected enlisted faction\'s game_faction_id', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveFactionTabController();
      const setters = buildSetters();

      await controller.confirmRemove(selected, character, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: jasmine.objectContaining({ factionId: 11 }),
      }));
    });

    it('applies the success outcome: purges the faction cache, clears selection, notifies onSuccess, and reloads',
      async function() {
        spyOn(RequestStore, 'purge');
        spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
        const controller = new RemoveFactionTabController();
        const setters = buildSetters();

        await controller.confirmRemove(selected, character, setters);

        expect(setters.setSubmitting).toHaveBeenCalledWith(false);
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'faction' });
        expect(setters.setSelected).toHaveBeenCalledWith(null);
        expect(setters.onSuccess).toHaveBeenCalledWith({ gameFactionId: 11 });
        expect(setters.reload).toHaveBeenCalled();
      });

    it('surfaces the error key, does not purge, and does not reload on a failure', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(404)));
      const controller = new RemoveFactionTabController();
      const setters = buildSetters();

      await controller.confirmRemove(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('faction_exchange_modal.generic_error');
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character canEdit flag through to the remove request', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(204)));
      const controller = new RemoveFactionTabController();
      const setters = buildSetters();
      const editorCharacter = { ...character, canEdit: true };

      await controller.confirmRemove(selected, editorCharacter, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });
  });
});
