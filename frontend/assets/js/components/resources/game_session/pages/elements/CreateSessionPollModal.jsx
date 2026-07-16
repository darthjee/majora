import { useEffect, useState } from 'react';
import CreateSessionPollModalHelper from './helpers/CreateSessionPollModalHelper.jsx';
import CreateSessionPollModalController from './controllers/CreateSessionPollModalController.js';

/**
 * Modal for creating a "pick our next session date" poll directly from a
 * game session page. Holds its own local dates list, seeded to a single
 * blank entry whenever the modal opens, independent from the caller's state
 * until confirmed.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {string} [props.error] - Error message to display, if any (e.g. after a failed submit).
 * @param {Function} props.onClose - Handler invoked when the modal is cancelled/dismissed.
 * @param {Function} props.onConfirm - Handler invoked with the non-blank dates array when the
 *   user confirms.
 * @returns {React.ReactElement} Rendered create-session-poll modal.
 */
export default function CreateSessionPollModal({
  show, error, onClose, onConfirm,
}) {
  const [dates, setDates] = useState(['']);

  useEffect(() => {
    if (!show) return;
    setDates(['']);
  }, [show]);

  const handleConfirm = () => onConfirm(CreateSessionPollModalController.nonBlankDates(dates));

  return CreateSessionPollModalHelper.render(
    show,
    { dates, canConfirm: CreateSessionPollModalController.canConfirm(dates), error },
    {
      onClose,
      onConfirm: handleConfirm,
      onDateChange: (index, value) => CreateSessionPollModalController.handleDateChange(
        index, value, dates, setDates,
      ),
      onDateRemove: (index) => CreateSessionPollModalController.handleDateRemove(index, dates, setDates),
    },
  );
}
