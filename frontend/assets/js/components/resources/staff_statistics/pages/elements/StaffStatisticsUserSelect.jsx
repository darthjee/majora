import { useEffect, useMemo, useState } from 'react';
import StaffStatisticsUserSelectController from './controllers/StaffStatisticsUserSelectController.js';
import StaffStatisticsUserSelectHelper from './helpers/StaffStatisticsUserSelectHelper.jsx';

/**
 * Searchable user select of the access statistics filter bar.
 *
 * @description With no user selected, renders a search input backed by a debounced
 *   `GET /staff/users.json?search=<text>` and its results (`name` with `email` as secondary
 *   text); choosing one calls `onChange(id)`. With a user selected (e.g. from the URL), shows
 *   its `name` (resolved via `GET /staff/users/<id>.json`, or `#<id>` with a "deleted user"
 *   hint when that fails) and a clear button calling `onChange(null)`.
 * @param {object} props - Component props.
 * @param {string} [props.id] - Id of the search input (for its label).
 * @param {string|null} props.value - Selected user id, or `null` for any user.
 * @param {Function} props.onChange - Called with the chosen user id (string), or `null`.
 * @returns {React.ReactElement} Rendered user select.
 */
export default function StaffStatisticsUserSelect({ id, value, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);

  const controller = useMemo(
    () => new StaffStatisticsUserSelectController({ setResults, setSearched, setSelected }),
    [],
  );

  useEffect(() => controller.buildSearchEffect(searchTerm)(), [controller, searchTerm]);
  useEffect(() => controller.buildSelectedEffect(value)(), [controller, value]);

  return StaffStatisticsUserSelectHelper.render(
    {
      id, value, selected, searchTerm, results, searched,
    },
    {
      onSearchChange: setSearchTerm,
      onSelect: (user) => onChange(String(user.id)),
      onClear: () => onChange(null),
    },
  );
}
