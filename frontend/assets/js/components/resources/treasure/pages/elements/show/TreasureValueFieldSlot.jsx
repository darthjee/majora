import React from 'react';
import TreasureValueField from '../TreasureValueField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

const LABEL_KEYS = {
  new: 'game_treasure_new_page.value_label',
  edit: 'game_treasure_edit_page.value_label',
};

/**
 * New/edit-mode right-column slot: the treasure's collapsed value field, paired with a button
 * that opens the value-editing modal (`MoneyEditModal`, wired by the owning page). The "edit
 * value" button label is shared between new and edit — both `GameTreasureNewHelper` and
 * `GameTreasureEditHelper` already used the same `game_treasures_page.edit` key before this
 * migration (issue #738).
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.value - Current treasure value, in the currency's lowest denomination.
 * @param {object} [context.fieldErrors] - Field-level submission errors, keyed by field name.
 * @param {string} [context.gameType] - Currency model name determining which denominations are
 *   displayed. Defaults to `dnd`.
 * @param {{onOpenValueModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Treasure value field.
 */
export default function TreasureValueFieldSlot({
  mode, value, fieldErrors = {}, gameType, handlers,
}) {
  return (
    <TreasureValueField
      label={Translator.t(LABEL_KEYS[mode])}
      editLabel={Translator.t('game_treasures_page.edit')}
      value={value}
      errors={fieldErrors.value ?? []}
      gameType={gameType}
      onOpenModal={handlers.onOpenValueModal}
    />
  );
}
