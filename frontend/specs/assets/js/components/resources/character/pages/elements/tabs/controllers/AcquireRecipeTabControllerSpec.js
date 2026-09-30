import AcquireRecipeTabController
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireRecipeTabController.js';
import itBehavesLikeRecipeExchangeTabController, { pc, npc }
  from '../../../../../../../../../support/recipeExchangeTabControllerExamples.js';

itBehavesLikeRecipeExchangeTabController({
  label: 'AcquireRecipeTabController',
  Controller: AcquireRecipeTabController,
  browseQuantityType: 'availableCollection',
  mutationQuantityType: 'acquire',
  selected: { id: 12, name: 'Potion' },
  gameRecipeId: 12,
  // Acquire keys off the game-level flag only.
  variants: [[pc, 'regular'], [{ ...pc, canEdit: true }, 'regular'], [npc, 'private']],
});
