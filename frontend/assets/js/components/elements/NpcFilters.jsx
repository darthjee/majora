import { useState } from 'react';
import NpcFiltersController from './controllers/NpcFiltersController.js';
import NpcFiltersHelper from './helpers/NpcFiltersHelper.jsx';
import HashRouteResolver from '../../utils/HashRouteResolver.js';

/**
 * NPC filter/search bar rendered above the game NPCs list, with a Status
 * dropdown (blank/Alive/Slain), a Name text search, a Query button and a
 * Clear button. Draft fields are pre-populated from the current hash's
 * `slain`/`name` query params so deep-linked filtered URLs restore the UI.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{slain, name}` query object
 *   (blank fields omitted) when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the
 *   draft fields have been reset to blank.
 * @returns {React.ReactElement} rendered NPC filters bar.
 */
export default function NpcFilters({ onQuery, onClear }) {
  const initialFilters = new HashRouteResolver().getFilterParams();
  const [status, setStatus] = useState(NpcFiltersController.slainToStatus(initialFilters.get('slain')));
  const [name, setName] = useState(initialFilters.get('name') ?? '');

  const controller = new NpcFiltersController(setStatus, setName);

  const handleQuery = () => {
    onQuery(controller.buildQuery(status, name));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return NpcFiltersHelper.render(
    { status, name },
    {
      onStatusChange: (value) => controller.handleStatusChange(value),
      onNameChange: (value) => controller.handleNameChange(value),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
