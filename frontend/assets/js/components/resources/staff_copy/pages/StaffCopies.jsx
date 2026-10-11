import { useEffect, useMemo, useState } from 'react';
import StaffCopiesController from './controllers/StaffCopiesController.js';
import StaffCopiesHelper from './helpers/StaffCopiesHelper.jsx';

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

  const controller = useMemo(() => new StaffCopiesController({
    setTypes, setGames, setSelection, setRows, setPagination, setLoading, setError, setListError,
  }), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return {
    state: { types, games, selection, rows, pagination, loading, error, listError },
    controller,
  };
}

/**
 * Render the staff-only game content copy page (issue #1571).
 *
 * @returns {React.ReactElement} Staff copy page.
 */
export default function StaffCopies() {
  const { state } = useStaffCopiesState();

  if (state.loading) return StaffCopiesHelper.renderLoading();
  if (state.error) return StaffCopiesHelper.renderError(state.error);

  return StaffCopiesHelper.renderLoading();
}
