import RecipeImage from '../../../../resources/recipe/pages/elements/show/RecipeImage.jsx';
import RecipeNameHeading from '../../../../resources/recipe/pages/elements/show/RecipeNameHeading.jsx';
import RecipeOutputField from '../../../../resources/recipe/pages/elements/show/RecipeOutputField.jsx';
import RecipeYieldField from '../../../../resources/recipe/pages/elements/show/RecipeYieldField.jsx';
import RecipeCraftingTimeField from '../../../../resources/recipe/pages/elements/show/RecipeCraftingTimeField.jsx';
import RecipeCraftingCostField from '../../../../resources/recipe/pages/elements/show/RecipeCraftingCostField.jsx';
import RecipeDescriptionField from '../../../../resources/recipe/pages/elements/show/RecipeDescriptionField.jsx';
import RecipeIngredientsField from '../../../../resources/recipe/pages/elements/show/RecipeIngredientsField.jsx';
import RecipeChecksField from '../../../../resources/recipe/pages/elements/show/RecipeChecksField.jsx';
import CharacterRecipeBackLink from '../../../../resources/character/pages/elements/show/CharacterRecipeBackLink.jsx';
import CharacterRecipeHiddenField
  from '../../../../resources/character/pages/elements/show/CharacterRecipeHiddenField.jsx';
import CharacterRecipeGameRecipeLink
  from '../../../../resources/character/pages/elements/show/CharacterRecipeGameRecipeLink.jsx';

/**
 * `showTypeConfig` entry for the PC/NPC `CharacterRecipe` detail page (issue #1450), mirroring
 * `characterDocumentShowType`: `Show`-only (no edit route exists — `hidden` is the only writable
 * field, toggled in place by `CharacterRecipeHiddenField`). The display fields reuse #1449's
 * `recipe` show-mode elements verbatim, since a `CharacterRecipe` detail carries the linked
 * `GameRecipe`'s own display fields (`name`, `output`, `yield_quantity`, `crafting_time`,
 * `crafting_cost`, `description`, `ingredients`, `checks`).
 */
const characterRecipeShowType = {
  left: [
    { Show: CharacterRecipeBackLink },
    { Show: RecipeImage.Show },
    { Show: RecipeNameHeading },
    { Show: CharacterRecipeHiddenField },
  ],
  right: [
    { Show: RecipeOutputField.Show },
    { Show: RecipeYieldField.Show },
    { Show: RecipeCraftingTimeField.Show },
    { Show: RecipeCraftingCostField.Show },
    { Show: RecipeDescriptionField.Show },
    { Show: RecipeIngredientsField.Show },
    { Show: RecipeChecksField.Show },
    { Show: CharacterRecipeGameRecipeLink },
  ],
  bottom: [],
};

export default characterRecipeShowType;
