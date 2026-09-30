import RecipePreviewCardHelper from './helpers/RecipePreviewCardHelper.jsx';

/**
 * Read-only grid-cell card showing a single recipe (its output's photo, with the recipe's name on
 * hover), styled like `CommonItemPreviewCard`, for use in preview sections. When `href` is given,
 * the whole card links to it (the recipe's own detail page).
 *
 * @param {object} props - Component props.
 * @param {object} props.recipe - `GameRecipe` list item.
 * @param {string} props.recipe.name - Recipe name.
 * @param {{photo_path: (string|null)}|null} [props.recipe.output] - Output common item, or null
 *   when masked.
 * @param {string} [props.href] - Optional hash href the whole card links to.
 * @returns {React.ReactElement} Recipe preview card element.
 */
export default function RecipePreviewCard({ recipe, href }) {
  return RecipePreviewCardHelper.render(recipe, href);
}
