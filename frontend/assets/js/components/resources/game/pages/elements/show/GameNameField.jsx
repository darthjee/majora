import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const LABEL_KEYS = { new: 'game_new_page.name_label', edit: 'game_edit_page.name_label' };

/**
 * New/edit-mode right-column slot: the game's name field. Shared by both modes since it's
 * visually and behaviorally identical, only the `id` and translated label differ. Gated on
 * `isFullEditor` (default `true`, so creation — which has no such concept — always shows it):
 * a regular (non-full, staff/player) editor reaching the game edit page may edit
 * `description`/`links` but not rename the game, so the field is hidden for them.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.name - Current name field value.
 * @param {boolean} [context.isFullEditor] - Whether the current editor may rename the game;
 *   defaults to `true` (game creation has no full/regular distinction).
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onNameChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement|null} Name form field, or `null` for a regular editor.
 */
export default function GameNameField({
  mode, name, isFullEditor = true, fieldErrors = {}, handlers,
}) {
  if (!isFullEditor) return null;

  return (
    <FormField
      id={`game-${mode}-name`}
      type="text"
      label={Translator.t(LABEL_KEYS[mode])}
      value={name}
      onChange={handlers.onNameChange}
      errors={fieldErrors.name ?? []}
    />
  );
}
