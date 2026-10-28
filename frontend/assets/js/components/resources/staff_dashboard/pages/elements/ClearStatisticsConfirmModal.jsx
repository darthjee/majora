import { useState } from 'react';
import ClearStatisticsConfirmModalHelper from './helpers/ClearStatisticsConfirmModalHelper.jsx';

/**
 * The word the user must type to confirm the clear. Never translated.
 */
export const CONFIRMATION_WORD = 'CLEAR';

/**
 * Typed-confirmation modal shown before clearing every statistic (issue #1685).
 *
 * @description Confirm stays disabled until the input matches `CLEAR` exactly (case-sensitive,
 *   trimmed). Cancel, close and confirm all reset the input, so reopening starts empty.
 * @param {{show: boolean, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered clear-statistics confirmation modal.
 */
export default function ClearStatisticsConfirmModal({ show, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const canConfirm = value.trim() === CONFIRMATION_WORD;

  const handleCancel = () => {
    setValue('');
    onCancel();
  };

  const handleConfirm = () => {
    setValue('');
    onConfirm();
  };

  return ClearStatisticsConfirmModalHelper.render(show, { value, canConfirm }, {
    onChange: (event) => setValue(event.target.value),
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  });
}
