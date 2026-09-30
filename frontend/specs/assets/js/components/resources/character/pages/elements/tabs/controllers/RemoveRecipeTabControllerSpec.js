import RemoveRecipeTabController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveRecipeTabController.js';
import itBehavesLikeRecipeExchangeTabController, { pc, npc }
  from '../../../../../../../../../support/recipeExchangeTabControllerExamples.js';

itBehavesLikeRecipeExchangeTabController({
  label: 'RemoveRecipeTabController',
  Controller: RemoveRecipeTabController,
  browseQuantityType: 'collection',
  mutationQuantityType: 'remove',
  selected: { id: 3, game_recipe_id: 12, name: 'Potion' },
  gameRecipeId: 12,
  // Remove keys off the character-level flag only.
  variants: [[pc, 'regular'], [{ ...pc, canEdit: true }, 'private'], [{ ...npc, canEdit: false }, 'regular']],
});
