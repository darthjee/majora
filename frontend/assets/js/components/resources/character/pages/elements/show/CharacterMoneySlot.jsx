import React from 'react';
import CharacterMoney from '../CharacterMoney.jsx';
import CharacterMoneyField from '../CharacterMoneyField.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the character's money breakdown, identical for PCs and NPCs.
 *
 * @description The "Edit" link is shown whenever the current user can reach the narrow-PATCH
 *   edit surface that includes `money` — i.e. a full (dm/admin/owner) editor, any player of the
 *   game, or a Staff account — matching `CharacterRegularEditPermission`/`NpcPlayerEditPermission`
 *   on the backend, for both PCs and NPCs (issue #915).
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {number} context.money - Total money, in the currency's lowest denomination.
 * @param {number} [context.treasure_value] - Read-only treasure value (issue #616).
 * @param {string} [context.game_type] - Currency model name (e.g. `dnd`, `deadlands`).
 * @param {boolean} [context.can_edit] - Whether the current user is a full (dm/admin/owner)
 *   editor of the character.
 * @param {boolean} [context.is_player] - Whether the current user is a player of the game.
 * @param {boolean} [context.is_staff] - Whether the current user is a Staff account.
 * @param {object} context.handlers - Event handlers.
 * @returns {React.ReactElement|null} Money breakdown element, or null.
 */
function CharacterMoneyShow({
  money, treasure_value: treasureValue, game_type: gameType,
  can_edit: canEdit, is_player: isPlayer, is_staff: isStaff, handlers,
}) {
  const canEditMoney = Boolean(canEdit || isPlayer || isStaff);

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
 * @description `canEditMoney` is set uniformly for both PC and NPC edit pages (from
 *   `CharacterEdit.jsx`'s `canReachEditPage(character)`, i.e. `can_edit || is_player || is_staff`)
 *   and ORed in alongside `isFullEditor` before reaching `CharacterMoneyField`, so a kind's
 *   regular (non-full) editor — any player of the game, or Staff — also sees the money block; NPC
 *   money edits now follow the same player/staff leniency as PCs (issue #915), no longer
 *   admin/dm/staff-only. `canEditMoney` is `undefined`/falsy for the NPC "new" flow, which never
 *   sets it, so no behavior change there (creation stays full-editor-only for `money`).
 * @param {{edit: {label: string, button: string}, new: {label: string, button: string}}} variants
 *   - Per-mode label/button i18n keys, keyed by `'edit'` and/or `'new'` (PCs only ever provide
 *   `'edit'`). `new` money is always created with a `treasureValue` of `0` (the character does
 *   not exist yet), matching `GameNpcNewHelper`'s existing hard-coded `0`.
 * @returns {Function} New/edit-mode money field slot component.
 */
export function buildCharacterMoneyField(variants) {
  return function CharacterMoneyEditOrNew({
    mode, isFullEditor, canEditMoney, money, treasureValue = 0, gameType, fieldErrors = {}, handlers,
  }) {
    const { label, button } = variants[mode];

    return (
      <CharacterMoneyField
        isFullEditor={isFullEditor || canEditMoney}
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
