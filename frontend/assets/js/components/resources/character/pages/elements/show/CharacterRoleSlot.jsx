import React from 'react';
import CharacterRole from '../CharacterRole.jsx';
import CharacterRoleField from '../CharacterRoleField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode right-column slot: the character's role line, identical for PCs and NPCs.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} [context.role] - Character role.
 * @returns {React.ReactElement|null} Role paragraph, or null.
 */
function CharacterRoleShow({ role }) {
  return <CharacterRole role={role} />;
}

/**
 * Build the new/edit-mode role field slot for a character kind.
 *
 * @description Both NPCs and PCs always show the role field regardless of `isFullEditor` (any
 *   editor reaching the edit page — full editor, player, or Staff on a PC — may edit the
 *   character's role, and NPC creation is always performed by a full editor), matching
 *   `BaseCharacterEditHelper#render`'s `isFullEditor={state.isFullEditor || this.idPrefix === 'npc'}`
 *   rule.
 * @param {{edit: {id: string, label: string}, new: {id: string, label: string}}} variants -
 *   Per-mode `id`/label i18n key pair, keyed by `'edit'` and/or `'new'` (PCs only ever provide
 *   `'edit'`).
 * @param {boolean} alwaysShow - Whether the field is visible regardless of `isFullEditor`
 *   (`true` for both NPCs and PCs).
 * @returns {Function} New/edit-mode role field slot component.
 */
export function buildCharacterRoleField(variants, alwaysShow) {
  return function CharacterRoleEditOrNew({
    mode, role, isFullEditor, fieldErrors = {}, handlers,
  }) {
    const { id, label } = variants[mode];

    return (
      <CharacterRoleField
        isFullEditor={alwaysShow || isFullEditor}
        id={id}
        label={Translator.t(label)}
        value={role}
        onChange={handlers.onRoleChange}
        errors={fieldErrors.role ?? []}
      />
    );
  };
}

export default CharacterRoleShow;
