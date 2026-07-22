import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the character's name heading, identical for PCs and NPCs.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.name - Character name.
 * @returns {React.ReactElement} Name heading element.
 */
function CharacterNameShow({ name }) {
  return <h1>{name}</h1>;
}

/**
 * Build the new/edit-mode name field slot for a character kind.
 *
 * @description Only PCs gate this on `isFullEditor` (a PC's name is a dm/admin-only concern);
 *   NPCs always show it, since any NPC editor (player or full) may edit an NPC's name, and NPC
 *   creation is always performed by a full editor. Matches
 *   `BaseCharacterEditHelper#renderNameField` and `GameNpcNewHelper`'s always-visible name field.
 * @param {{edit: {id: string, labelKey: string}, new: {id: string, labelKey: string}}} variants -
 *   Per-mode `id`/`labelKey` pair, keyed by `'edit'` and/or `'new'` (PCs only ever provide
 *   `'edit'`, since there is no PC creation flow).
 * @param {boolean} alwaysShow - Whether the field renders regardless of `isFullEditor` (`true`
 *   for NPCs, `false` for PCs).
 * @returns {Function} New/edit-mode name field slot component.
 */
export function buildCharacterNameField(variants, alwaysShow) {
  return function CharacterNameEditOrNew({
    mode, name, isFullEditor, fieldErrors = {}, handlers,
  }) {
    if (!alwaysShow && !isFullEditor) return null;

    const { id, labelKey } = variants[mode];

    return (
      <FormField
        id={id}
        type="text"
        label={Translator.t(labelKey)}
        value={name}
        onChange={handlers.onNameChange}
        errors={fieldErrors.name ?? []}
      />
    );
  };
}

export default CharacterNameShow;
