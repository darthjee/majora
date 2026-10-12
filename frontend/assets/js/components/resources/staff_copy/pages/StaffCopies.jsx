import { useEffect, useMemo, useState } from 'react';
import StaffCopiesController from './controllers/StaffCopiesController.js';
import StaffCopiesHelper from './helpers/StaffCopiesHelper.jsx';
import useStaffCopySelection from './hooks/useStaffCopySelection.js';
import buildStaffCopiesHandlers from './hooks/buildStaffCopiesHandlers.js';
import StaffCopyConfirmModal from './elements/StaffCopyConfirmModal.jsx';

/**
 * Hook holding every piece of staff copy page state, plus the controller wired to it.
 *
 * @returns {{state: object, controller: StaffCopiesController}} Page state and controller.
 */
function useStaffCopiesState() {
  const [types, setTypes] = useState([]);
  const [games, setGames] = useState([]);
  const [selection, setSelection] = useState({ type: '', from: '', to: '' });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listError, setListError] = useState(null);
  const [run, setRun] = useState(null);

  const controller = useMemo(() => new StaffCopiesController({
    setTypes, setGames, setSelection, setRows, setPagination, setLoading, setError, setListError, setRun,
  }), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return {
    state: {
      types, games, selection, rows, pagination, loading, error, listError, run, running: Boolean(run?.running),
    },
    controller,
  };
}

/**
 * Render the staff-only game content copy page (issue #1571): source/target game selectors,
 * per-type tabs, the selectable source list, the sequential copy run with its progress, and the
 * re-copy confirmation.
 *
 * @returns {React.ReactElement} Staff copy page.
 */
export default function StaffCopies() {
  const { state, controller } = useStaffCopiesState();
  const selection = useStaffCopySelection(state.rows);
  const [pendingCopy, setPendingCopy] = useState(null);

  if (state.loading) return StaffCopiesHelper.renderLoading();
  if (state.error) return StaffCopiesHelper.renderError(state.error);

  const { page, modal } = buildStaffCopiesHandlers({
    controller, selection, pendingCopy, setPendingCopy,
  });

  return (
    <>
      {StaffCopiesHelper.render({ ...state, selectedIds: selection.selectedIds }, page)}
      <StaffCopyConfirmModal show={pendingCopy !== null} onConfirm={modal.onConfirm} onCancel={modal.onCancel} />
    </>
  );
}
