import CharacterMoneyFieldHelper from './helpers/CharacterMoneyFieldHelper.jsx';

/**
 * Editable money field for the character edit page: the money breakdown
 * display plus an "Edit money" button opening the money edit modal.
 * Renders nothing when the current editor is not a full editor (money is
 * a dm/admin-only concern).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isFullEditor - Whether the current editor may see/edit money.
 * @param {string} props.label - Translated money field label.
 * @param {number} props.money - Total money, expressed in the currency's lowest denomination.
 * @param {number} [props.treasureValue] - Treasure value, expressed in the currency's lowest
 *   denomination, rendered read-only alongside `money` (issue #616). Defaults to `0`.
 * @param {string} [props.gameType] - Currency model name (e.g. `dnd`, `deadlands`).
 * @param {string} props.buttonLabel - Translated "Edit money" button label.
 * @param {Function} props.onOpenMoneyModal - Handler invoked when the button is clicked.
 * @param {string[]} [props.errors] - Field-level error messages to display below the field.
 * @returns {React.ReactElement|null} Money field element, or null.
 */
export default function CharacterMoneyField({
  isFullEditor, label, money, treasureValue = 0, gameType, buttonLabel, onOpenMoneyModal, errors = [],
}) {
  return CharacterMoneyFieldHelper.render(
    isFullEditor, label, money, treasureValue, gameType, buttonLabel, onOpenMoneyModal, errors,
  );
}
