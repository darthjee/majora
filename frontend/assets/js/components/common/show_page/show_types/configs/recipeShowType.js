import RecipeImage from '../../../../resources/recipe/pages/elements/show/RecipeImage.jsx';
import RecipeNameHeading from '../../../../resources/recipe/pages/elements/show/RecipeNameHeading.jsx';
import RecipeTitle from '../../../../resources/recipe/pages/elements/show/RecipeTitle.jsx';
import RecipeNameField from '../../../../resources/recipe/pages/elements/show/RecipeNameField.jsx';
import RecipeOutputField from '../../../../resources/recipe/pages/elements/show/RecipeOutputField.jsx';
import RecipeYieldField from '../../../../resources/recipe/pages/elements/show/RecipeYieldField.jsx';
import RecipeCraftingTimeField from '../../../../resources/recipe/pages/elements/show/RecipeCraftingTimeField.jsx';
import RecipeCraftingCostField from '../../../../resources/recipe/pages/elements/show/RecipeCraftingCostField.jsx';
import RecipeDescriptionField from '../../../../resources/recipe/pages/elements/show/RecipeDescriptionField.jsx';
import RecipeIngredientsField from '../../../../resources/recipe/pages/elements/show/RecipeIngredientsField.jsx';
import RecipeChecksField from '../../../../resources/recipe/pages/elements/show/RecipeChecksField.jsx';
import RecipeHiddenBadge from '../../../../resources/recipe/pages/elements/show/RecipeHiddenBadge.jsx';
import RecipeHiddenField from '../../../../resources/recipe/pages/elements/show/RecipeHiddenField.jsx';
import RecipeSubmitButton from '../../../../resources/recipe/pages/elements/show/RecipeSubmitButton.jsx';
import buildShortListSlot from '../../../cards/buildShortListSlot.js';

/**
 * `showTypeConfig` entry for the `recipe` show/new/edit pages (issue #1449), modeled on
 * `commonItemShowType` minus every photo-upload affordance (a recipe shows its output's photo).
 * Like `commonItemShowType`, the edit form keeps the `hidden` switch in the left column while the
 * creation form keeps it inline with the other fields. The show page ends with the "Known by"
 * shortlist (#1450).
 */
const recipeShowType = {
  left: [
    RecipeImage,
    { Show: RecipeNameHeading },
    { Edit: RecipeHiddenField },
  ],
  right: [
    { New: RecipeTitle, Edit: RecipeTitle },
    { New: RecipeNameField, Edit: RecipeNameField },
    RecipeOutputField,
    RecipeYieldField,
    RecipeCraftingTimeField,
    RecipeCraftingCostField,
    RecipeDescriptionField,
    RecipeIngredientsField,
    RecipeChecksField,
    { Show: RecipeHiddenBadge },
    { Show: buildShortListSlot('recipeCharacter') },
    { New: RecipeHiddenField },
    { New: RecipeSubmitButton, Edit: RecipeSubmitButton },
  ],
  bottom: [],
};

export default recipeShowType;
