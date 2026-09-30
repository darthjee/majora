import React from 'react';
import CardRecipeImage from '../CardRecipeImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the RecipePreviewCard element.
 */
export default class RecipePreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a recipe's output photo (placeholder when masked),
   * matching `CommonItemPreviewCardHelper`'s layout, with the recipe's name shown on hover.
   *
   * @param {object} recipe - `GameRecipe` list item.
   * @param {string} recipe.name - Recipe name.
   * @param {{photo_path: (string|null)}|null} [recipe.output] - Output common item.
   * @param {string} [href] - Optional hash href the whole card links to.
   * @returns {React.ReactElement} Recipe preview card element.
   */
  static render(recipe, href) {
    const card = (
      <div className="card h-100">
        <CardRecipeImage url={recipe.output?.photo_path} alt={recipe.name} />
      </div>
    );

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={recipe.name}>
          {RecipePreviewCardHelper.#wrapWithLink(card, href)}
        </CardHoverTooltip>
      </div>
    );
  }

  static #wrapWithLink(card, href) {
    if (!href) {
      return card;
    }

    return (
      <a href={href} className="text-decoration-none text-dark">
        {card}
      </a>
    );
  }
}
