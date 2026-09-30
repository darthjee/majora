import GameRecipeController
  from '../../../../../../../../assets/js/components/resources/recipe/pages/controllers/GameRecipeController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameRecipeController', function() {
  let setRecipe;
  let setLoading;
  let setError;
  let setCanEdit;
  let client;
  let ensureSpy;

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const build = () => new GameRecipeController(setRecipe, setLoading, setError, setCanEdit, client);

  beforeEach(function() {
    setRecipe = jasmine.createSpy('setRecipe');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanEdit = jasmine.createSpy('setCanEdit');
    client = jasmine.createSpyObj('client', ['currentHash']);
    client.currentHash.and.returnValue('#/games/demo/recipes/5');
    spyOn(AccessStore, 'ensureRecipePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 5, name: 'Brew' } }));
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and recipe id', function() {
      expect(GameRecipeController.getParamsFromHash('#/games/demo/recipes/5')).toEqual({ game_slug: 'demo', id: '5' });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameRecipeController.getParamsFromHash('#/games/demo')).toEqual({ game_slug: '', id: '' });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the recipe through RequestStore', async function() {
      const cleanup = build().buildEffect()();
      await flush();

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameRecipeController',
        resource: 'recipe',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '5' },
      });
      expect(setRecipe).toHaveBeenCalledWith({ id: 5, name: 'Brew' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();
      cleanup();
    });

    it('sets an error when the fetch fails (e.g. 404)', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('404')));

      const cleanup = build().buildEffect()();
      await flush();

      expect(setError).toHaveBeenCalledWith('Unable to load recipe.');
      expect(setLoading).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('sets an error without fetching for a non-matching hash', function() {
      client.currentHash.and.returnValue('#/games/demo');

      build().buildEffect()();

      expect(ensureSpy).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load recipe.');
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('resolves canEdit through ensureRecipePermissions', async function() {
      AccessStore.ensureRecipePermissions.and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = build().buildEffect()();
      await flush();

      expect(AccessStore.ensureRecipePermissions).toHaveBeenCalledWith('demo');
      expect(setCanEdit).toHaveBeenCalledWith(true);
      cleanup();
    });

    it('fails closed when the permissions check rejects', async function() {
      AccessStore.ensureRecipePermissions.and.returnValue(Promise.reject(new Error('nope')));

      const cleanup = build().buildEffect()();
      await flush();

      expect(setCanEdit).toHaveBeenCalledWith(false);
      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = build().buildEffect()();
      cleanup();
      await flush();

      expect(setRecipe).not.toHaveBeenCalled();
      expect(setCanEdit).not.toHaveBeenCalled();
    });
  });
});
