import { PER_PAGE }
  from '../../assets/js/components/resources/character/pages/elements/tabs/controllers/BaseRecipeExchangeTabController.js';
import RequestStore from '../../assets/js/utils/requests/RequestStore.js';

export const pc = {
  id: 7, game_slug: 'demo', is_pc: true, canEdit: false, gameCanEdit: false,
};
export const npc = {
  id: 9, game_slug: 'demo', is_pc: false, canEdit: true, gameCanEdit: true,
};

const buildSetters = () => ({
  setSubmitting: jasmine.createSpy('setSubmitting'),
  setSelected: jasmine.createSpy('setSelected'),
  setActionError: jasmine.createSpy('setActionError'),
  onSuccess: jasmine.createSpy('onSuccess'),
  reload: jasmine.createSpy('reload'),
});

const ERROR_CASES = [
  [422, 'recipe_exchange_modal.already_owned_error'],
  [404, 'recipe_exchange_modal.not_found_error'],
  [400, 'recipe_exchange_modal.generic_error'],
];

const itLoadsPages = ({
  label, browseQuantityType, selected, getController,
}) => {
  describe('#loadPage', function() {
    it(`browses characterRecipe.${browseQuantityType} with the name filter`, async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [selected], pagination: { page: 2, pages: 3 },
      }));
      const setBrowse = jasmine.createSpy('setBrowse');

      await getController().loadPage(2, npc, 'pot', setBrowse);

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: label,
        resource: 'characterRecipe',
        quantityType: browseQuantityType,
        params: { gameSlug: 'demo', kind: 'npcs', id: 9 },
        query: { page: 2, per_page: PER_PAGE, name: 'pot' },
      });
      expect(setBrowse.calls.first().args[0]({ items: [1] }))
        .toEqual({ items: [1], loading: true, error: '' });
      expect(setBrowse).toHaveBeenCalledWith({
        items: [selected], page: 2, pages: 3, loading: false, error: '',
      });
    });

    it('defaults non-array data to an empty list', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: null, pagination: { page: 1, pages: 1 } }));
      const setBrowse = jasmine.createSpy('setBrowse');

      await getController().loadPage(1, pc, '', setBrowse);

      expect(setBrowse.calls.mostRecent().args[0].items).toEqual([]);
    });

    it('surfaces the load error key on failure', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const setBrowse = jasmine.createSpy('setBrowse');

      await getController().loadPage(1, pc, '', setBrowse);

      expect(setBrowse.calls.mostRecent().args[0]({ items: [] })).toEqual({
        items: [], loading: false, error: 'recipe_exchange_modal.load_error',
      });
    });
  });
};

const itConfirms = ({
  label, mutationQuantityType, selected, gameRecipeId, variants, getController,
}) => {
  describe('#confirm', function() {
    variants.forEach(([character, variantName]) => {
      it(`posts {game_recipe_id} through the ${variantName} variant`, async function() {
        spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true, status: 201 }));
        spyOn(RequestStore, 'purge');

        await getController().confirm(selected, character, buildSetters());

        expect(RequestStore.mutate).toHaveBeenCalledWith({
          componentName: label,
          resource: 'characterRecipe',
          method: 'POST',
          quantityType: mutationQuantityType,
          params: { gameSlug: 'demo', kind: character.is_pc ? 'pcs' : 'npcs', id: character.id },
          body: { game_recipe_id: gameRecipeId },
          variantName,
        });
      });
    });

    it('purges characterRecipe and recipe, clears the selection and notifies on success', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: true, status: 204 }));
      spyOn(RequestStore, 'purge');
      const setters = buildSetters();

      await getController().confirm(selected, pc, setters);

      expect(setters.setSubmitting.calls.allArgs()).toEqual([[true], [false]]);
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'characterRecipe' });
      expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'recipe' });
      expect(setters.setSelected).toHaveBeenCalledWith(null);
      expect(setters.onSuccess).toHaveBeenCalledWith({ gameRecipeId });
      expect(setters.reload).toHaveBeenCalled();
      expect(setters.setActionError).not.toHaveBeenCalled();
    });

    ERROR_CASES.forEach(([status, errorKey]) => {
      it(`surfaces ${errorKey} on a ${status}`, async function() {
        spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok: false, status }));
        spyOn(RequestStore, 'purge');
        const setters = buildSetters();

        await getController().confirm(selected, pc, setters);

        expect(setters.setActionError).toHaveBeenCalledWith(errorKey);
        expect(RequestStore.purge).not.toHaveBeenCalled();
        expect(setters.onSuccess).not.toHaveBeenCalled();
      });
    });
  });
};

/**
 * Shared examples for the recipe exchange tab controllers (issue #1450): browse query, submit
 * variant/body, purge on success and error mapping.
 *
 * @param {object} config - Controller under test (`label`, `Controller`) and its expectations
 *   (`browseQuantityType`, `mutationQuantityType`, `selected`, `gameRecipeId`, `variants`).
 */
export default function itBehavesLikeRecipeExchangeTabController(config) {
  describe(config.label, function() {
    let controller;
    const getController = () => controller;

    beforeEach(function() {
      controller = new config.Controller();
    });

    itLoadsPages({ ...config, getController });
    itConfirms({ ...config, getController });
  });
}
