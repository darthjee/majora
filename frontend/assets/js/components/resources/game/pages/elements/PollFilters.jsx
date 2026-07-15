import { useState } from 'react';
import PollFiltersController from './controllers/PollFiltersController.js';
import PollFiltersHelper from './helpers/PollFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Poll filter bar rendered above the game polls list, with a Status
 * dropdown (blank/open/inactive/closed), a Query button and a Clear
 * button. The draft field is pre-populated from the current hash's
 * `status` query param so deep-linked filtered URLs restore the UI.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{status}` query object (blank
 *   omitted) when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the
 *   draft field has been reset to blank.
 * @returns {React.ReactElement} rendered poll filters bar.
 */
export default function PollFilters({ onQuery, onClear }) {
  const initialFilters = new HashRouteResolver().getFilterParams();
  const [status, setStatus] = useState(initialFilters.get('status') ?? '');

  const controller = new PollFiltersController(setStatus);

  const handleQuery = () => {
    onQuery(controller.buildQuery(status));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return PollFiltersHelper.render(
    { status },
    {
      onStatusChange: (value) => controller.handleStatusChange(value),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
