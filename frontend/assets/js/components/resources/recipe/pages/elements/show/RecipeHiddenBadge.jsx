import React from 'react';
import Icons from '../../../../../../utils/ui/Icons.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: a "Hidden" badge, rendered only when the recipe is hidden from
 * players (`hidden` is only present in the editor-only `/full.json` variant).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {boolean} [context.hidden] - Whether the recipe is hidden.
 * @returns {React.ReactElement|null} Badge, or null when not hidden.
 */
export default function RecipeHiddenBadge({ hidden }) {
  if (!hidden) {
    return null;
  }

  return (
    <p>
      <span className="badge text-bg-secondary" data-testid="recipe-hidden-badge">
        <i className={`bi ${Icons.eyeSlashFill} me-1`} />
        {Translator.t('recipe_page.hidden_label')}
      </span>
    </p>
  );
}
