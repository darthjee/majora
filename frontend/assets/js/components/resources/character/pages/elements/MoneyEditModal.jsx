import { useEffect, useState } from 'react';
import MoneyEditModalHelper from './helpers/MoneyEditModalHelper.jsx';
import MoneyEditModalController from './controllers/MoneyEditModalController.js';

/**
 * Modal for locally editing a character's money as a per-denomination
 * breakdown (CP/SP/GP/PP/gems) before committing the recalculated total
 * together with the rest of the character edit form. Holds its own local
 * breakdown state, seeded from `props.money` whenever the modal opens,
 * independent from the character page's money state until confirmed.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {number|string} props.money - Character's current money, expressed in copper
 *   pieces, used to seed the modal's local state whenever it opens.
 * @param {Function} props.onClose - Handler invoked when the modal is cancelled/dismissed,
 *   discarding local changes.
 * @param {Function} props.onConfirm - Handler invoked with the recalculated raw copper
 *   total when the user confirms.
 * @returns {React.ReactElement} Rendered money edit modal.
 */
export default function MoneyEditModal({ show, money, onClose, onConfirm }) {
  const [breakdown, setBreakdown] = useState(MoneyEditModalController.seedBreakdown(money));

  useEffect(() => {
    if (!show) return;
    setBreakdown(MoneyEditModalController.seedBreakdown(money));
  }, [show, money]);

  const handleFieldChange = (key, value) => {
    setBreakdown((current) => MoneyEditModalController.updateField(current, key, Number(value)));
  };

  const handleConfirm = () => onConfirm(MoneyEditModalController.computeTotal(breakdown));

  return MoneyEditModalHelper.render(
    show,
    { breakdown, canConfirm: MoneyEditModalController.canConfirm(breakdown) },
    {
      onClose,
      onConfirm: handleConfirm,
      onFieldChange: handleFieldChange,
    },
  );
}
