import { useMemo } from 'react';
import StatisticsUsersTableController from './controllers/StatisticsUsersTableController.js';
import StatisticsUsersTableHelper from './helpers/StatisticsUsersTableHelper.jsx';

/**
 * Ranking table of the Users tab (issue #1520).
 *
 * @description Sorting is server-side and lives in the URL: each sortable header is a link to
 *   the same tab sorted by that column (back to page 1). Clicking a row (or pressing Enter /
 *   Space on it) opens the Overview tab filtered by that user, keeping the other filters;
 *   the row's profile link opens the staff user page instead.
 * @param {object} props - Component props.
 * @param {object[]} props.rows - User rows in API order (see `UsersController.map`).
 * @param {string} props.sort - The current sort key (see `usersSort.currentSort`).
 * @param {object} props.filters - Current statistics filters, carried into the links.
 * @returns {React.ReactElement} The rendered table.
 */
export default function StatisticsUsersTable({ rows, sort, filters }) {
  const controller = useMemo(() => new StatisticsUsersTableController({ filters }), [filters]);

  return StatisticsUsersTableHelper.render(
    { rows, sort, filters },
    {
      onRowClick: (row) => controller.openRow(row),
      onRowKeyDown: (event, row) => controller.handleRowKeyDown(event, row),
    },
  );
}
