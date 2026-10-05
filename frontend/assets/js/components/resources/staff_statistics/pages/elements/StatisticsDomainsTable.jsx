import { useMemo, useState } from 'react';
import sortDomains from '../helpers/domainsSort.js';
import StatisticsDomainsTableController, { DEFAULT_SORT } from './controllers/StatisticsDomainsTableController.js';
import StatisticsDomainsTableHelper from './helpers/StatisticsDomainsTableHelper.jsx';

/**
 * Sortable table of the Domains tab (issue #1517).
 *
 * @description Holds the client-side sort (component state, not in the URL; the API order
 *   by default, the "unknown" row always last). Clicking a header toggles its sort;
 *   clicking a row (or pressing Enter / Space on it) opens the Overview tab filtered by
 *   that domain, keeping the other filters.
 * @param {object} props - Component props.
 * @param {object[]} props.rows - Domain rows in API order (see `DomainsController.map`).
 * @param {string[]} props.series - Visible series keys (`anonymous` and/or `logged_in`).
 * @param {object} props.filters - Current statistics filters, carried into the row links.
 * @returns {React.ReactElement} The rendered table.
 */
export default function StatisticsDomainsTable({ rows, series, filters }) {
  const [sort, setSort] = useState(DEFAULT_SORT);
  const controller = useMemo(
    () => new StatisticsDomainsTableController({ setSort, filters }),
    [filters],
  );

  return StatisticsDomainsTableHelper.render(
    { rows: sortDomains(rows, sort), series, sort },
    {
      onSort: (key) => controller.toggleSort(key),
      onRowClick: (row) => controller.openRow(row),
      onRowKeyDown: (event, row) => controller.handleRowKeyDown(event, row),
    },
  );
}
