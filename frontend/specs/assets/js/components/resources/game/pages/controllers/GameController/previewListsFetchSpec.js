import GameController from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { MAX_PREVIEW_ITEMS } from '../../../../../../../../../assets/js/components/common/cards/characterPreviewConstants.js';
import { stubEnsureGameAccess, stubEnsureGamePermissions } from './support.js';

/**
 * @description Stubs `RequestStore.ensure` to resolve per-resource, mirroring `#fetchGame`'s
 *   `game.single` request alongside the `pc.collection`/`npc.collection` preview requests
 *   `#fetchPcsPreview`/`#fetchNpcsPreview` issue against it (issue #791 phase 5/N).
 * @param {object} [pcResult] - Value the `pc` resource resolves `{ data }` to.
 * @param {object} [npcResult] - Value the `npc` resource resolves `{ data }` to, or a rejected
 *   promise to simulate a failed fetch.
 * @returns {jasmine.Spy} the installed `RequestStore.ensure` spy.
 */
function wrapResult(result) {
  return result instanceof Promise ? result : Promise.resolve({ data: result });
}

function stubEnsureByResource(pcResult = [], npcResult = []) {
  return spyOn(RequestStore, 'ensure').and.callFake(({ resource }) => {
    if (resource === 'game') {
      return Promise.resolve({ data: { game_slug: 'demo' } });
    }
    if (resource === 'pc') {
      return wrapResult(pcResult);
    }
    if (resource === 'npc') {
      return wrapResult(npcResult);
    }
    return Promise.resolve({ data: [] });
  });
}

describe('GameController', function() {
  beforeEach(function() {
    stubEnsureGameAccess();
    stubEnsureGamePermissions();
  });

  it('fetches the PCs preview list alongside the game through RequestStore', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const pcs = [{ id: 1, name: 'Aragorn' }];

    client.currentHash.and.returnValue('#/games/demo');
    const ensureSpy = stubEnsureByResource(pcs, []);

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureSpy).toHaveBeenCalledWith({
      resource: 'pc',
      quantityType: 'collection',
      params: { gameSlug: 'demo' },
      query: { per_page: MAX_PREVIEW_ITEMS },
    });
    expect(setPcs).toHaveBeenCalledWith(pcs);

    cleanup();
  });

  it('fetches the NPCs preview list alongside the game through RequestStore', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash']);
    const npcs = [{ id: 2, name: 'Gandalf' }];

    client.currentHash.and.returnValue('#/games/demo');
    const ensureSpy = stubEnsureByResource([], npcs);

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureSpy).toHaveBeenCalledWith({
      resource: 'npc',
      quantityType: 'collection',
      params: { gameSlug: 'demo' },
      query: { per_page: MAX_PREVIEW_ITEMS },
    });
    expect(setNpcs).toHaveBeenCalledWith(npcs);

    cleanup();
  });

  it('sets an empty PCs list and still renders the game when the PCs fetch fails', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash']);

    client.currentHash.and.returnValue('#/games/demo');
    stubEnsureByResource(Promise.reject(new Error('boom')), []);

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setPcs).toHaveBeenCalledWith([]);
    expect(setGame).toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets an empty NPCs list and still renders the game when the NPCs fetch fails', async function() {
    const setGame = jasmine.createSpy('setGame');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setPcs = jasmine.createSpy('setPcs');
    const setNpcs = jasmine.createSpy('setNpcs');
    const client = jasmine.createSpyObj('client', ['currentHash']);

    client.currentHash.and.returnValue('#/games/demo');
    stubEnsureByResource([], Promise.reject(new Error('boom')));

    const cleanup = new GameController(setGame, setLoading, setError, setPcs, setNpcs, client)
      .buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setNpcs).toHaveBeenCalledWith([]);
    expect(setGame).toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
