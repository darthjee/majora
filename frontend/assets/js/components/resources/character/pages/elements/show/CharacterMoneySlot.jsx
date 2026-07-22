import React from 'react';
import CharacterMoney from '../CharacterMoney.jsx';
import CharacterMoneyField from '../CharacterMoneyField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the character's money breakdown, identical for PCs and NPCs.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {number} context.money - Total money, in the currency's lowest denomination.
 * @param {number} [context.treasure_value] - Read-only treasure value (issue #616).
 * @param {string} [context.game_type] - Currency model name (e.g. `dnd`, `deadlands`).
 * @param {boolean} [context.can_edit_money] - Whether the "Edit" link is shown.
 * @param {object} context.handlers - Event handlers.
 * @returns {React.ReactElement|null} Money breakdown element, or null.
 */
function CharacterMoneyShow({
  money, treasure_value: treasureValue, game_type: gameType, can_edit_money: canEditMoney, handlers,
}) {
  return (
    <CharacterMoney
      money={money}
      treasureValue={treasureValue}
      gameType={gameType}
      canEditMoney={canEditMoney}
      onEditMoney={handlers.onOpenMoneyModal}
    />
  );
}

/**
 * Build the new/edit-mode money field slot for a character kind.
 *
 * @param {{edit: {label: string, button: string}, new: {label: string, button: string}}} variants
 *   - Per-mode label/button i18n keys, keyed by `'edit'` and/or `'new'` (PCs only ever provide
 *   `'edit'`). `new` money is always created with a `treasureValue` of `0` (the character does
 *   not exist yet), matching `GameNpcNewHelper`'s existing hard-coded `0`.
 * @returns {Function} New/edit-mode money field slot component.
 */
export function buildCharacterMoneyField(variants) {
  return function CharacterMoneyEditOrNew({
    mode, isFullEditor, money, treasureValue = 0, gameType, fieldErrors = {}, handlers,
  }) {
    const { label, button } = variants[mode];

    return (
      <CharacterMoneyField
        isFullEditor={isFullEditor}
        label={Translator.t(label)}
        money={money}
        treasureValue={treasureValue}
        gameType={gameType}
        buttonLabel={Translator.t(button)}
        onOpenMoneyModal={handlers.onOpenMoneyModal}
        errors={fieldErrors.money ?? []}
      />
    );
  };
}

export default CharacterMoneyShow;
