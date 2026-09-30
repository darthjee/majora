import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot for the character recipe detail page (issue #1450): the `hidden`
 * switch, like `ItemHiddenField`. Only rendered when the entry was served by `full.json` (the only
 * variant carrying `hidden`), i.e. to callers allowed to toggle it; each change is persisted
 * immediately through `handlers.onHiddenChange`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {boolean} [context.hidden] - Current `hidden` value, absent on the regular variant.
 * @param {{onHiddenChange: Function}} context.handlers - Event handlers; `onHiddenChange` receives
 *   the new boolean value.
 * @returns {React.ReactElement|null} Hidden switch element, or null when `hidden` is absent.
 */
export default function CharacterRecipeHiddenField({ hidden, handlers }) {
  if (typeof hidden !== 'boolean') {
    return null;
  }

  return (
    <div className="form-check form-switch mb-3">
      <input
        id="character-recipe-hidden"
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={hidden}
        onChange={(event) => handlers.onHiddenChange(event.target.checked)}
      />
      <label htmlFor="character-recipe-hidden" className="form-check-label">
        {Translator.t('character_recipe_page.hidden_toggle_label')}
      </label>
    </div>
  );
}
