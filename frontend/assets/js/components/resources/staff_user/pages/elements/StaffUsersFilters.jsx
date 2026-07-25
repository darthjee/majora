import { useState } from 'react';
import StaffUsersFiltersController from './controllers/StaffUsersFiltersController.js';
import StaffUsersFiltersHelper from './helpers/StaffUsersFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Staff users filter bar rendered above the staff users list, with a Status
 * dropdown (all/pending/approved/denied), a single Search text input (name/
 * display name/email), a Query button and a Clear button. Draft fields are
 * pre-populated from the current hash's `status`/`search` query params so
 * deep-linked filtered URLs restore the UI.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{status, search}` query object
 *   (blank fields omitted) when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the
 *   draft fields have been reset to blank.
 * @returns {React.ReactElement} rendered staff users filters bar.
 */
export default function StaffUsersFilters({ onQuery, onClear }) {
  const initialFilters = new HashRouteResolver().getFilterParams();
  const [status, setStatus] = useState(initialFilters.get('status') ?? '');
  const [search, setSearch] = useState(initialFilters.get('search') ?? '');

  const controller = new StaffUsersFiltersController(setStatus, setSearch);

  const handleQuery = () => {
    onQuery(controller.buildQuery(status, search));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return StaffUsersFiltersHelper.render(
    { status, search },
    {
      onStatusChange: (value) => controller.handleStatusChange(value),
      onSearchChange: (value) => controller.handleSearchChange(value),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
