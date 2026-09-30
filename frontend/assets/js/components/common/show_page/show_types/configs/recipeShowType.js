import RecipeImage from '../../../../resources/recipe/pages/elements/show/RecipeImage.jsx';
import RecipeNameHeading from '../../../../resources/recipe/pages/elements/show/RecipeNameHeading.jsx';
import RecipeOutputField from '../../../../resources/recipe/pages/elements/show/RecipeOutputField.jsx';
import RecipeYieldField from '../../../../resources/recipe/pages/elements/show/RecipeYieldField.jsx';
import RecipeCraftingTimeField from '../../../../resources/recipe/pages/elements/show/RecipeCraftingTimeField.jsx';
import RecipeCraftingCostField from '../../../../resources/recipe/pages/elements/show/RecipeCraftingCostField.jsx';
import RecipeDescriptionField from '../../../../resources/recipe/pages/elements/show/RecipeDescriptionField.jsx';
import RecipeIngredientsField from '../../../../resources/recipe/pages/elements/show/RecipeIngredientsField.jsx';
import RecipeChecksField from '../../../../resources/recipe/pages/elements/show/RecipeChecksField.jsx';
import RecipeHiddenBadge from '../../../../resources/recipe/pages/elements/show/RecipeHiddenBadge.jsx';

/**
 * `showTypeConfig` entry for the `recipe` show/new/edit pages (issue #1449), modeled on
 * `commonItemShowType` minus every photo-upload affordance (a recipe shows its output's photo).
 * The "Known by" shortlist is intentionally absent (#1450).
 */
const recipeShowType = {
  left: [
    RecipeImage,
    { Show: RecipeNameHeading },
  ],
  right: [
    RecipeOutputField,
    RecipeYieldField,
    RecipeCraftingTimeField,
    RecipeCraftingCostField,
    RecipeDescriptionField,
    RecipeIngredientsField,
    RecipeChecksField,
    { Show: RecipeHiddenBadge },
  ],
  bottom: [],
};

export default recipeShowType;
