import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';

/**
 * Show-mode left-column slot: the recipe's output common item photo (a recipe has no photo of its
 * own), falling back to the common-item placeholder when the output is masked or has no photo.
 * No upload affordance — recipe pages are photo-less.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {{photo_path: (string|null)}|null} [context.output] - Output common item, or null when
 *   masked.
 * @param {string} context.name - Recipe name, used as the image's alt text.
 * @returns {React.ReactElement} Recipe image element.
 */
function RecipeImageShow({ output, name }) {
  return <ActionsOverlay type="recipe" url={output?.photo_path ?? null} alt={name} canEdit={false} />;
}

/**
 * Mode-variant image slot for the recipe show/new/edit pages.
 */
const RecipeImage = { Show: RecipeImageShow };

export default RecipeImage;
