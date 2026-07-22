import React from 'react';
import CharacterDescription from '../CharacterDescription.jsx';
import CharacterDescriptionField from '../CharacterDescriptionField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the character's public description, identical for PCs and NPCs.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.public_description] - Character public description.
 * @returns {React.ReactElement|null} Description panel, or null.
 */
function CharacterDescriptionShow({ public_description: description }) {
  return <CharacterDescription description={description} />;
}

/**
 * Build the new/edit-mode public-description field slot for a character kind. Always visible,
 * regardless of editor kind (matching `BaseCharacterEditHelper#render`'s unconditional
 * `CharacterDescriptionField`).
 *
 * @param {{edit: {id: string, label: string}, new: {id: string, label: string}}} variants -
 *   Per-mode `id`/label i18n key pair, keyed by `'edit'` and/or `'new'` (PCs only ever provide
 *   `'edit'`).
 * @returns {Function} New/edit-mode description field slot component.
 */
export function buildCharacterDescriptionField(variants) {
  return function CharacterDescriptionEditOrNew({
    mode, description, fieldErrors = {}, handlers,
  }) {
    const { id, label } = variants[mode];

    return (
      <CharacterDescriptionField
        id={id}
        label={Translator.t(label)}
        value={description}
        onChange={handlers.onDescriptionChange}
        errors={fieldErrors.public_description ?? []}
      />
    );
  };
}

export default CharacterDescriptionShow;
