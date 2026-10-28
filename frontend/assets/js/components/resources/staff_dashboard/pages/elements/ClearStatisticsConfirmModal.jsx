import { useState } from 'react';
import ClearStatisticsConfirmModalController from './controllers/ClearStatisticsConfirmModalController.js';
import ClearStatisticsConfirmModalHelper from './helpers/ClearStatisticsConfirmModalHelper.jsx';

/**
 * Typed-confirmation modal shown before clearing every statistic (issue #1685).
 *
 * @description Confirm stays disabled until the input matches `CLEAR` (see
 *   `ClearStatisticsConfirmModalController`). Cancel, close and confirm all reset the input.
 * @param {{show: boolean, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered clear-statistics confirmation modal.
 */
export default function ClearStatisticsConfirmModal({ show, onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const controller = new ClearStatisticsConfirmModalController(setValue, { onConfirm, onCancel });

  return ClearStatisticsConfirmModalHelper.render(
    show,
    { value, canConfirm: ClearStatisticsConfirmModalController.canConfirm(value) },
    {
      onChange: (event) => controller.change(event),
      onConfirm: () => controller.confirm(),
      onCancel: () => controller.cancel(),
    },
  );
}
