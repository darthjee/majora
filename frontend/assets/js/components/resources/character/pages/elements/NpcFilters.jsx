import { useState } from 'react';
import NpcFiltersController from './controllers/NpcFiltersController.js';
import NpcFiltersHelper from './helpers/NpcFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * NPC filter/search bar rendered above the game NPCs list, with a public Status
 * dropdown (blank/Alive/Slain), a public Allegiance dropdown, a Name text search, a Query
 * button and a Clear button — plus, for dm/admin viewers (`canEdit`), a second private Status
 * dropdown and a second private Allegiance dropdown (mirroring how the Hidden dropdown is
 * already dm/admin-only). Draft fields are pre-populated from the current hash's
 * `public_slain`/`private_slain`/`name`/`public_allegiance`/`private_allegiance` query params
 * so deep-linked filtered URLs restore the UI.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{public_slain, name,
 *   public_allegiance, hidden, private_slain, private_allegiance}` query object (blank fields
 *   omitted) when the Query button is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the
 *   draft fields have been reset to blank.
 * @param {boolean} [props.canEdit] - Whether the current user is a dm/admin; gates the
 *   Hidden dropdown and the private Status/Allegiance dropdowns, only meaningful for a dm/admin.
 * @returns {React.ReactElement} rendered NPC filters bar.
 */
export default function NpcFilters({ onQuery, onClear, canEdit = false }) {
  const initialFilters = new HashRouteResolver().getFilterParams();
  const [status, setStatus] = useState(NpcFiltersController.slainToStatus(initialFilters.get('public_slain')));
  const [name, setName] = useState(initialFilters.get('name') ?? '');
  const [allegiance, setAllegiance] = useState(initialFilters.get('public_allegiance') ?? '');
  const [hidden, setHidden] = useState(NpcFiltersController.hiddenToFilter(initialFilters.get('hidden')));
  const [privateStatus, setPrivateStatus] = useState(
    NpcFiltersController.slainToStatus(initialFilters.get('private_slain')),
  );
  const [privateAllegiance, setPrivateAllegiance] = useState(initialFilters.get('private_allegiance') ?? '');

  const controller = new NpcFiltersController(
    setStatus, setName, setAllegiance, setHidden, setPrivateStatus, setPrivateAllegiance,
  );

  const handleQuery = () => {
    onQuery(controller.buildQuery(status, name, allegiance, hidden, privateStatus, privateAllegiance));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return NpcFiltersHelper.render(
    {
      status, name, allegiance, hidden, privateStatus, privateAllegiance, canEdit,
    },
    {
      onStatusChange: (value) => controller.handleStatusChange(value),
      onNameChange: (value) => controller.handleNameChange(value),
      onAllegianceChange: (value) => controller.handleAllegianceChange(value),
      onHiddenChange: (value) => controller.handleHiddenChange(value),
      onPrivateStatusChange: (value) => controller.handlePrivateStatusChange(value),
      onPrivateAllegianceChange: (value) => controller.handlePrivateAllegianceChange(value),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
