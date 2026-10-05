import StatisticsVisitListTableHelper from './helpers/StatisticsVisitListTableHelper.jsx';

/**
 * Visit table of the Visit list tab (issue #1523).
 *
 * @description Sorting is server-side and lives in the URL: each sortable header is a link to
 *   the same tab sorted by that column (back to page 1). Rows are not clickable; a logged-in
 *   user's name links to the Overview tab filtered by that user (keeping the other filters)
 *   and the profile link opens the staff user page.
 * @param {object} props - Component props.
 * @param {object[]} props.rows - Visit rows in API order (see `VisitListController.map`).
 * @param {string} props.sort - The current sort key (see `visitListSort.currentSort`).
 * @param {object} props.filters - Current statistics filters, carried into the links.
 * @returns {React.ReactElement} The rendered table.
 */
export default function StatisticsVisitListTable({ rows, sort, filters }) {
  return StatisticsVisitListTableHelper.render({ rows, sort, filters });
}
