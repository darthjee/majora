import BaseRecipeExchangeTabController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/BaseRecipeExchangeTabController.js';

describe('BaseRecipeExchangeTabController', function() {
  describe('.errorKeyFor', function() {
    it('maps 422 to already_owned_error', function() {
      expect(BaseRecipeExchangeTabController.errorKeyFor(422)).toBe('recipe_exchange_modal.already_owned_error');
    });

    it('maps 404 to not_found_error', function() {
      expect(BaseRecipeExchangeTabController.errorKeyFor(404)).toBe('recipe_exchange_modal.not_found_error');
    });

    it('maps anything else (e.g. 400) to generic_error', function() {
      expect(BaseRecipeExchangeTabController.errorKeyFor(400)).toBe('recipe_exchange_modal.generic_error');
    });
  });

  describe('defaults', function() {
    const controller = new BaseRecipeExchangeTabController({
      componentName: 'Base', browseQuantityType: 'collection', mutationQuantityType: 'remove',
    });

    it('uses the entry id as the game recipe id', function() {
      expect(controller.gameRecipeIdOf({ id: 4, game_recipe_id: 8 })).toBe(4);
    });

    it('picks the variant from the character-level flag', function() {
      expect(controller.variantNameFor({ canEdit: true })).toBe('private');
      expect(controller.variantNameFor({ canEdit: false, gameCanEdit: true })).toBe('regular');
    });
  });
});
