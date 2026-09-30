import recipeShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/recipeShowType.js';
import showTypeConfig
  from '../../../../../../../../assets/js/components/common/show_page/show_types/showTypeConfig.js';
import RecipeImage
  from '../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeImage.jsx';
import RecipeNameHeading
  from '../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeNameHeading.jsx';
import RecipeHiddenBadge
  from '../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeHiddenBadge.jsx';
import RecipeOutputField
  from '../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeOutputField.jsx';

describe('recipeShowType', function() {
  it('is registered as recipe in showTypeConfig', function() {
    expect(showTypeConfig.recipe).toBe(recipeShowType);
  });

  it('offers the output image in the left column in show mode', function() {
    expect(recipeShowType.left).toContain(RecipeImage);
    expect(RecipeImage.Show).toBeDefined();
  });

  it('shows the name heading only in show mode', function() {
    const nameEntry = recipeShowType.left.find((entry) => entry.Show === RecipeNameHeading);

    expect(nameEntry.New).toBeUndefined();
    expect(nameEntry.Edit).toBeUndefined();
  });

  it('shows the hidden badge only in show mode', function() {
    const badgeEntry = recipeShowType.right.find((entry) => entry.Show === RecipeHiddenBadge);

    expect(badgeEntry.New).toBeUndefined();
    expect(badgeEntry.Edit).toBeUndefined();
  });

  it('renders the output field in the right column', function() {
    expect(recipeShowType.right).toContain(RecipeOutputField);
  });

  it('has no bottom slot (no "Known by" shortlist)', function() {
    expect(recipeShowType.bottom).toEqual([]);
  });
});
