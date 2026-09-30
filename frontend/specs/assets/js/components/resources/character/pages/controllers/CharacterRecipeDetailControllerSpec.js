import CharacterRecipeDetailController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterRecipeDetailController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('CharacterRecipeDetailController', function() {
  let setRecipe;
  let setLoading;
  let setError;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setRecipe = jasmine.createSpy('setRecipe');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    client = jasmine.createSpyObj('client', ['currentHash']);
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 5, name: 'Potion' } }));
  });

  const build = (kind = 'pcs') => new CharacterRecipeDetailController(kind, setRecipe, setLoading, setError, client);

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and character recipe id', function() {
      expect(CharacterRecipeDetailController.getParamsFromHash('npcs', '#/games/demo/npcs/9/recipes/3')).toEqual({
        game_slug: 'demo', character_id: '9', id: '3',
      });
    });
  });

  describe('#buildEffect', function() {
    [
      ['pcs', '#/games/demo/pcs/7/recipes/5', {
        gameSlug: 'demo', kind: 'pcs', id: '7', characterRecipeId: '5',
      }],
      ['npcs', '#/games/demo/npcs/9/recipes/3', {
        gameSlug: 'demo', kind: 'npcs', id: '9', characterRecipeId: '3',
      }],
    ].forEach(([kind, hash, expectedParams]) => {
      it(`fetches the characterRecipe single entry for ${kind}`, async function() {
        client.currentHash.and.returnValue(hash);

        const cleanup = build(kind).buildEffect()();
        await flush();

        expect(ensureSpy).toHaveBeenCalledWith({
          componentName: 'CharacterRecipeDetailController',
          resource: 'characterRecipe',
          quantityType: 'single',
          params: expectedParams,
        });
        expect(setRecipe).toHaveBeenCalledWith({ id: 5, name: 'Potion' });
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).not.toHaveBeenCalled();
        cleanup();
      });
    });

    it('sets the not-found error when the fetch rejects (e.g. 404)', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/recipes/5');
      ensureSpy.and.returnValue(Promise.reject(new Error('404')));

      build().buildEffect()();
      await flush();

      expect(setError).toHaveBeenCalledWith(Translator.t('character_recipe_page.not_found'));
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('sets the not-found error without fetching when the hash is incomplete', function() {
      client.currentHash.and.returnValue('#/games/demo');

      build().buildEffect()();

      expect(ensureSpy).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith(Translator.t('character_recipe_page.not_found'));
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('does not set state after cleanup', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/recipes/5');

      const cleanup = build().buildEffect()();
      cleanup();
      await flush();

      expect(setRecipe).not.toHaveBeenCalled();
    });
  });

  describe('#toggleHidden', function() {
    let mutateSpy;

    beforeEach(function() {
      client.currentHash.and.returnValue('#/games/demo/npcs/9/recipes/3');
      mutateSpy = spyOn(RequestStore, 'mutate');
    });

    it('PATCHes {hidden} only and updates the local entry on success', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: true }));

      await build('npcs').toggleHidden({ id: 3, name: 'Potion', hidden: false }, true);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'CharacterRecipeDetailController',
        resource: 'characterRecipe',
        method: 'PATCH',
        quantityType: 'single',
        params: {
          gameSlug: 'demo', kind: 'npcs', id: '9', characterRecipeId: '3',
        },
        body: { hidden: true },
      });
      expect(setRecipe).toHaveBeenCalledWith({ id: 3, name: 'Potion', hidden: true });
    });

    it('keeps the entry unchanged when the server rejects the change', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false }));

      await build('npcs').toggleHidden({ id: 3, hidden: false }, true);

      expect(setRecipe).not.toHaveBeenCalled();
    });

    it('swallows network failures', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network')));

      await expectAsync(build('npcs').toggleHidden({ id: 3, hidden: false }, true)).toBeResolved();
      expect(setRecipe).not.toHaveBeenCalled();
    });
  });
});
