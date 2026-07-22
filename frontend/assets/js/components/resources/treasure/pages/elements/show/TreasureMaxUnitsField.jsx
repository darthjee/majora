import React from 'react';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Edit-mode right-column slot: the `max_units` field, hidden for treasures exclusive to the
 * game (via the `Treasure.game` FK) since the backend ignores it for them, matching
 * `GameTreasureEditHelper`'s existing gating. There is no `new` variant: treasure creation has
 * no cap concept, matching `GameTreasureNewHelper`'s existing form.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string} context.maxUnits - Current `max_units` field value (raw string; empty means
 *   unlimited).
 * @param {boolean} [context.isExclusive] - Whether the treasure is exclusive to the game.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {{onMaxUnitsChange: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement|null} Max units form field, or `null` for exclusive treasures.
 */
export default function TreasureMaxUnitsField({
  maxUnits, isExclusive, fieldErrors = {}, handlers,
}) {
  if (isExclusive) {
    return null;
  }

  return (
    <FormField
      id="game-treasure-edit-max-units"
      type="number"
      label={Translator.t('game_treasure_edit_page.max_units_label')}
      value={maxUnits}
      onChange={handlers.onMaxUnitsChange}
      errors={fieldErrors.max_units ?? []}
    />
  );
}
