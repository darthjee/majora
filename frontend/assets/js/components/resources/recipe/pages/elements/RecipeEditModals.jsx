import MoneyEditModal from '../../../../common/modals/MoneyEditModal.jsx';

/**
 * Modal wiring for the recipe new/edit pages (issue #1449): only the crafting-cost editor
 * (`MoneyEditModal`, reusing the `'treasure'` money context like the common item price) —
 * recipe pages are photo-less.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the crafting cost modal is visible.
 * @param {string|number} props.cost - Current crafting cost.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onConfirm - Handler invoked with the new total when confirmed.
 * @returns {React.ReactElement} Rendered modal.
 */
export default function RecipeEditModals({
  show, cost, onClose, onConfirm,
}) {
  return (
    <MoneyEditModal show={show} money={cost} context="treasure" onClose={onClose} onConfirm={onConfirm} />
  );
}
