import React from 'react';
import CharacterDmNotes from '../CharacterDmNotes.jsx';
import CharacterDmNotesField from '../CharacterDmNotesField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the character's DM notes, identical for PCs and NPCs.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.private_description] - Character private description (DM notes).
 * @returns {React.ReactElement|null} DM notes section, or null.
 */
function CharacterDmNotesShow({ private_description: privateDescription }) {
  return <CharacterDmNotes privateDescription={privateDescription} />;
}

/**
 * Build the new/edit-mode DM notes field slot for a character kind. Gated on `isFullEditor` for
 * both PCs and NPCs alike (DM notes stay a dm/admin-only concern even for an NPC's player
 * editor), matching `BaseCharacterEditHelper#render`'s unconditional `isFullEditor={state.isFullEditor}`.
 *
 * @param {{edit: {id: string, label: string}, new: {id: string, label: string}}} variants -
 *   Per-mode `id`/label i18n key pair, keyed by `'edit'` and/or `'new'` (PCs only ever provide
 *   `'edit'`; NPC creation's `isFullEditor` is always `true`, so the field is always visible
 *   there).
 * @returns {Function} New/edit-mode DM notes field slot component.
 */
export function buildCharacterDmNotesField(variants) {
  return function CharacterDmNotesEditOrNew({
    mode, privateDescription, isFullEditor, fieldErrors = {}, handlers,
  }) {
    const { id, label } = variants[mode];

    return (
      <CharacterDmNotesField
        isFullEditor={isFullEditor}
        id={id}
        label={Translator.t(label)}
        value={privateDescription}
        onChange={handlers.onPrivateDescriptionChange}
        errors={fieldErrors.private_description ?? []}
      />
    );
  };
}

export default CharacterDmNotesShow;
