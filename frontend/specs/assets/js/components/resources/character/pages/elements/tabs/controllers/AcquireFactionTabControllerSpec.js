import AcquireFactionTabController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireFactionTabController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../../assets/js/utils/Noop.js';
import { buildCharacter } from '../../../../../../../../../support/factories.js';

const buildResponse = (status, body) => ({
  ok: status === 201,
  status,
  json: () => Promise.resolve(body),
});

describe('AcquireFactionTabController', function() {
  describe('#fetchPage', function() {
    it('resolves data and pagination through RequestStore (faction.availableCollection)', async function() {
      const pagination = { page: 2, pages: 3, perPage: 5 };
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'The Silver Hand' }], pagination,
      }));
      const controller = new AcquireFactionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, { page: 2, perPage: 5, search: 'silver' });

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'AcquireFactionTabController',
        resource: 'faction',
        quantityType: 'availableCollection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 2, per_page: 5, name: 'silver' },
      });
      expect(result).toEqual({ data: [{ id: 1, name: 'The Silver Hand' }], pagination });
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 10 },
      }));
      const controller = new AcquireFactionTabController();

      const result = await controller.fetchPage('demo', 'pcs', 7, {});

      expect(result.data).toEqual([]);
    });
  });

  describe('#loadPage', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });

    it('fetches through RequestStore and applies the resulting items/pagination on success', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'The Silver Hand' }], pagination: { page: 2, pages: 4, perPage: 10 },
      }));
      const controller = new AcquireFactionTabController();
      const setBrowse = jasmine.createSpy('setBrowse');

      await controller.loadPage(2, character, 'silver', setBrowse);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'AcquireFactionTabController',
        resource: 'faction',
        quantityType: 'availableCollection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { page: 2, per_page: 10, name: 'silver' },
      });
      expect(setBrowse).toHaveBeenCalledWith({
        items: [{ id: 1, name: 'The Silver Hand' }], page: 2, pages: 4, loading: false, error: '',
      });
    });

    it('sets a load error when the RequestStore fetch rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new AcquireFactionTabController();
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
      const controller = new AcquireFactionTabController();
      const setBrowse = jasmine.createSpy('setBrowse');
      const npcCharacter = buildCharacter({ id: 7, game_slug: 'demo', is_pc: false });

      await controller.loadPage(1, npcCharacter, '', setBrowse);

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });
  });

  describe('#acquire', function() {
    it('always submits hidden: false (no per-faction hidden default, issue #943)', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquireFactionTabController();

      await controller.acquire('demo', 7, true, { gameFactionId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'AcquireFactionTabController',
        resource: 'faction',
        method: 'POST',
        quantityType: 'acquire',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        body: { game_faction_id: 9, hidden: false },
        variantName: 'regular',
      });
    });

    it('resolves the npc kind when isPc is false', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireFactionTabController();

      await controller.acquire('demo', 7, false, { gameFactionId: 9 });

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 7 },
      }));
    });

    it('returns the already-enlisted error key using the backend error code (issue #943)', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_faction_id: ['game_faction_already_enlisted'] } })),
      );
      const controller = new AcquireFactionTabController();

      const result = await controller.acquire('demo', 7, true, { gameFactionId: 9 });

      expect(result).toEqual({ ok: false, errorKey: 'faction_exchange_modal.already_enlisted_error' });
    });

    it('falls back to a generic error key for unrecognized error messages', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_faction_id: ['something else'] } })),
      );
      const controller = new AcquireFactionTabController();

      const result = await controller.acquire('demo', 7, true, { gameFactionId: 9 });

      expect(result).toEqual({ ok: false, errorKey: 'faction_exchange_modal.generic_error' });
    });

    it('passes the private variant when gameCanEdit is true', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, {})));
      const controller = new AcquireFactionTabController();

      await controller.acquire('demo', 7, true, { gameFactionId: 9 }, true);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });
  });

  describe('#confirmAcquire', function() {
    const character = buildCharacter({ id: 7, game_slug: 'demo', is_pc: true });
    const selected = { id: 9, name: 'The Silver Hand', photo_path: '/faction.png' };

    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setSelected: jasmine.createSpy('setSelected'),
      setActionError: jasmine.createSpy('setActionError'),
      onSuccess: jasmine.createSpy('onSuccess'),
      reload: jasmine.createSpy('reload'),
    });

    it('sets submitting true before the request settles', function() {
      spyOn(RequestStore, 'mutate').and.returnValue(new Promise(Noop.noop));
      const controller = new AcquireFactionTabController();
      const setters = buildSetters();

      controller.confirmAcquire(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
    });

    it('applies the success outcome: purges the faction cache, clears selection, notifies onSuccess, and reloads',
      async function() {
        spyOn(RequestStore, 'purge');
        const characterFaction = { id: 3, game_faction_id: 9, name: 'The Silver Hand' };
        spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, characterFaction)));
        const controller = new AcquireFactionTabController();
        const setters = buildSetters();

        await controller.confirmAcquire(selected, character, setters);

        expect(setters.setSubmitting).toHaveBeenCalledWith(false);
        expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'faction' });
        expect(setters.setSelected).toHaveBeenCalledWith(null);
        expect(setters.onSuccess).toHaveBeenCalledWith({ gameFactionId: 9, characterFaction });
        expect(setters.reload).toHaveBeenCalled();
      });

    it('surfaces the error key, does not purge, and does not reload on a validation failure', async function() {
      spyOn(RequestStore, 'purge');
      spyOn(RequestStore, 'mutate').and.returnValue(
        Promise.resolve(buildResponse(422, { errors: { game_faction_id: ['game_faction_already_enlisted'] } })),
      );
      const controller = new AcquireFactionTabController();
      const setters = buildSetters();

      await controller.confirmAcquire(selected, character, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(setters.setActionError).toHaveBeenCalledWith('faction_exchange_modal.already_enlisted_error');
      expect(RequestStore.purge).not.toHaveBeenCalled();
      expect(setters.setSelected).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
      expect(setters.reload).not.toHaveBeenCalled();
    });

    it('threads the character gameCanEdit flag through to the acquire request', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve(buildResponse(201, { id: 3 })));
      const controller = new AcquireFactionTabController();
      const setters = buildSetters();
      const editorCharacter = { ...character, gameCanEdit: true };

      await controller.confirmAcquire(selected, editorCharacter, setters);

      expect(RequestStore.mutate).toHaveBeenCalledWith(jasmine.objectContaining({ variantName: 'private' }));
    });
  });
});
