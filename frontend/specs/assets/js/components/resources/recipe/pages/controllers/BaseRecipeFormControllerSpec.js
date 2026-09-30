import BaseRecipeFormController
  from '../../../../../../../../assets/js/components/resources/recipe/pages/controllers/BaseRecipeFormController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('BaseRecipeFormController', function() {
  let originalWindow;
  let setters;
  let controller;
  const mutation = { resource: 'recipe', method: 'POST' };
  const context = {
    gameSlug: 'demo', recipeId: undefined, hidden: false, canEditGame: true,
  };
  const respond = (status, data) => spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
    ok: status < 300, status, json: () => Promise.resolve(data),
  }));

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/recipes/new' } };
    setters = { setStatus: jasmine.createSpy('setStatus'), setFieldErrors: jasmine.createSpy('setFieldErrors') };
    controller = new BaseRecipeFormController();
    spyOn(RequestStore, 'purge');
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#submitRecipe', function() {
    it('prevents default, resets state, and sends the mutation', async function() {
      respond(201, { id: 9 });
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await controller.submitRecipe(event, mutation, context, setters);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setters.setStatus).toHaveBeenCalledWith('submitting');
      expect(setters.setFieldErrors).toHaveBeenCalledWith({});
      expect(RequestStore.mutate).toHaveBeenCalledWith(mutation);
    });

    it('purges recipes and redirects to the saved recipe on success', async function() {
      respond(201, { id: 9 });

      await controller.submitRecipe(undefined, mutation, context, setters);

      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'recipe' });
      expect(globalThis.window.location.hash).toBe('/games/demo/recipes/9');
    });

    it('falls back to the context recipe id', async function() {
      respond(200, {});

      await controller.submitRecipe(undefined, mutation, { ...context, recipeId: '5' }, setters);

      expect(globalThis.window.location.hash).toBe('/games/demo/recipes/5');
    });

    it('redirects to the list when saved hidden without game can_edit', async function() {
      respond(201, { id: 9 });

      await controller.submitRecipe(undefined, mutation, { ...context, hidden: true, canEditGame: false }, setters);

      expect(globalThis.window.location.hash).toBe('/games/demo/recipes');
    });

    it('sets field errors on a 400', async function() {
      respond(400, { errors: { game_common_item_id: ['does_not_exist'] } });

      await controller.submitRecipe(undefined, mutation, context, setters);

      expect(setters.setFieldErrors).toHaveBeenCalledWith({ game_common_item_id: ['does_not_exist'] });
      expect(setters.setStatus).toHaveBeenCalledWith('idle');
      expect(RequestStore.purge).not.toHaveBeenCalled();
    });

    it('sets empty field errors on a 400 without errors', async function() {
      respond(400, {});

      await controller.submitRecipe(undefined, mutation, context, setters);

      expect(setters.setFieldErrors.calls.mostRecent().args[0]).toEqual({});
    });

    it('sets the error status on other failures', async function() {
      respond(500, {});

      await controller.submitRecipe(undefined, mutation, context, setters);

      expect(setters.setStatus).toHaveBeenCalledWith('error');
    });

    it('tolerates a non-JSON response body', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: false, status: 500, json: () => Promise.reject(new Error('bad json')),
      }));

      await controller.submitRecipe(undefined, mutation, context, setters);

      expect(setters.setStatus).toHaveBeenCalledWith('error');
    });

    it('sets the error status when the request rejects', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.reject(new Error('network')));

      await controller.submitRecipe(undefined, mutation, context, setters);

      expect(setters.setStatus).toHaveBeenCalledWith('error');
    });
  });
});
