import React from 'react';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the CharacterDmNotes element.
 */
export default class CharacterDmNotesHelper {
  /**
   * Render the DM notes section when private_description is non-empty.
   *
   * @param {string} [privateDescription] - Private description text.
   * @returns {React.ReactElement|null} DM notes section, or null.
   */
  static render(privateDescription) {
    if (!privateDescription) return null;

    return (
      <div className="mt-4">
        <h5>{Translator.t('character_full_page.private_description_label')}</h5>
        <div className="p-3 border rounded bg-light text-pre-wrap">{privateDescription}</div>
      </div>
    );
  }
}
