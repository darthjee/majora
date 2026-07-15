import React from 'react';
import CharacterMoney from '../CharacterMoney.jsx';
import FieldErrors from '../../../../../common/FieldErrors.jsx';

/**
 * Rendering helper for the CharacterMoneyField element.
 */
export default class CharacterMoneyFieldHelper {
  /**
   * Render the money breakdown and its "Edit money" button, or null when
   * the current editor is not a full editor.
   *
   * @param {boolean} isFullEditor - Whether the current editor may see/edit money.
   * @param {string} label - Translated money field label.
   * @param {number} money - Total money, expressed in the currency's lowest denomination.
   * @param {string} gameType - Currency model name (e.g. `dnd`, `deadlands`).
   * @param {string} buttonLabel - Translated "Edit money" button label.
   * @param {Function} onOpenMoneyModal - Handler invoked when the button is clicked.
   * @param {string[]} errors - Field-level error messages to display below the field.
   * @returns {React.ReactElement|null} Money field element, or null.
   */
  static render(isFullEditor, label, money, gameType, buttonLabel, onOpenMoneyModal, errors) {
    if (!isFullEditor) return null;

    return (
      <div className="mb-3">
        <label className="form-label">{label}</label>
        <CharacterMoney money={Number(money) || 0} gameType={gameType} />
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onOpenMoneyModal}
        >
          {buttonLabel}
        </button>
        <FieldErrors errors={errors} />
      </div>
    );
  }
}
