import { useEffect, useState } from 'react';
import MoneyEditModalHelper from './helpers/MoneyEditModalHelper.jsx';
import MoneyEditModalController from './controllers/MoneyEditModalController.js';

/**
 * Modal for locally editing a money value as a per-denomination breakdown
 * before committing the recalculated total. Holds its own local breakdown
 * state, seeded from `props.money` whenever the modal opens, independent
 * from the caller's money state until confirmed. Which denominations are
 * shown is driven by `props.context` (e.g. `character` renders CP/SP/GP/PP/
 * gems, `treasure` renders CP/SP/GP only), backed by `DndMoneyModel`.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {number|string} props.money - Current money, expressed in copper
 *   pieces, used to seed the modal's local state whenever it opens.
 * @param {string} [props.context] - Money context (`character` or `treasure`)
 *   determining which denominations are editable. Defaults to `character`.
 * @param {Function} props.onClose - Handler invoked when the modal is cancelled/dismissed,
 *   discarding local changes.
 * @param {Function} props.onConfirm - Handler invoked with the recalculated raw copper
 *   total when the user confirms.
 * @returns {React.ReactElement} Rendered money edit modal.
 */
export default function MoneyEditModal({
  show, money, context = 'character', onClose, onConfirm,
}) {
  const [breakdown, setBreakdown] = useState(MoneyEditModalController.seedBreakdown(money, context));

  useEffect(() => {
    if (!show) return;
    setBreakdown(MoneyEditModalController.seedBreakdown(money, context));
  }, [show, money, context]);

  const handleFieldChange = (key, value) => {
    setBreakdown((current) => MoneyEditModalController.updateField(current, key, Number(value)));
  };

  const handleConfirm = () => onConfirm(MoneyEditModalController.computeTotal(breakdown, context));

  return MoneyEditModalHelper.render(
    show,
    { breakdown, canConfirm: MoneyEditModalController.canConfirm(breakdown, context) },
    {
      onClose,
      onConfirm: handleConfirm,
      onFieldChange: handleFieldChange,
    },
    context,
  );
}
