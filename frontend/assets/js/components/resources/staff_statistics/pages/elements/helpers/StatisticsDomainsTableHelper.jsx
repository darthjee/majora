import { Table } from 'react-bootstrap';
import Translator from '../../../../../../i18n/Translator.js';
import { ASCENDING } from '../../helpers/domainsSort.js';
import StatisticsBucketFormatter from '../../helpers/StatisticsBucketFormatter.js';
import StatisticsDurationFormatter from '../../helpers/StatisticsDurationFormatter.js';

const EMPTY = '—';
const t = (key) => Translator.t(`staff_statistics_page.domains.${key}`);
const count = (value) => StatisticsBucketFormatter.count(value);
const duration = (value) => StatisticsDurationFormatter.format(value);

/**
 * Columns of the Domains table, in display order.
 *
 * @type {{key: string, labelKey: string, format: Function, series?: boolean}[]}
 */
export const DOMAINS_COLUMNS = Object.freeze([
  { key: 'label', labelKey: 'domain', format: (value) => value },
  { key: 'group', labelKey: 'group', format: (value) => value ?? EMPTY },
  { key: 'visits', labelKey: 'visits', format: count },
  {
    key: 'anonymous', labelKey: 'anonymous', format: count, series: true,
  },
  {
    key: 'logged_in', labelKey: 'logged_in', format: count, series: true,
  },
  { key: 'unique_visitors', labelKey: 'unique_visitors', format: count },
  { key: 'average_duration_seconds', labelKey: 'average_duration', format: duration },
  { key: 'median_duration_seconds', labelKey: 'median_duration', format: duration },
]);

/**
 * Rendering helper of the `StatisticsDomainsTable` element (issue #1517).
 */
export default class StatisticsDomainsTableHelper {
  /**
   * Renders the sortable domains table.
   *
   * @description A react-bootstrap `Table` (`hover`, `responsive`) with one sortable header
   *   button per column and one link row per domain. The anonymous / logged-in columns only
   *   render when their series is visible. The sorted header carries `aria-sort` and an
   *   arrow with a visually hidden direction label.
   * @param {object} state - Table state.
   * @param {object[]} state.rows - Rows in display order (already sorted).
   * @param {string[]} state.series - Visible series keys (`anonymous` and/or `logged_in`).
   * @param {{key: ?string, direction: string}} state.sort - The current sort.
   * @param {object} handlers - Event handlers.
   * @param {Function} handlers.onSort - Called with a column key on header click.
   * @param {Function} handlers.onRowClick - Called with a row on row click.
   * @param {Function} handlers.onRowKeyDown - Called with the event and a row on row key down.
   * @returns {React.ReactElement} The table.
   */
  static render({ rows, series, sort }, handlers) {
    const columns = StatisticsDomainsTableHelper.visibleColumns(series);

    return (
      <Table hover responsive data-testid="statistics-domains-table">
        <thead>
          <tr>
            {columns.map((column) => StatisticsDomainsTableHelper.#renderHeader(column, sort, handlers.onSort))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => StatisticsDomainsTableHelper.#renderRow(row, columns, handlers))}
        </tbody>
      </Table>
    );
  }

  /**
   * Resolves the visible columns for the visible series.
   *
   * @param {string[]} series - Visible series keys.
   * @returns {object[]} The visible column definitions, in display order.
   */
  static visibleColumns(series) {
    return DOMAINS_COLUMNS.filter((column) => !column.series || series.includes(column.key));
  }

  static #renderHeader({ key, labelKey }, sort, onSort) {
    const sorted = sort.key === key;
    const ascending = sort.direction === ASCENDING;
    const ariaSort = ascending ? 'ascending' : 'descending';

    return (
      <th key={key} scope="col" aria-sort={sorted ? ariaSort : 'none'}>
        <button type="button" className="btn btn-link p-0 text-reset fw-bold" onClick={() => onSort(key)}>
          {t(labelKey)}
          {StatisticsDomainsTableHelper.#renderIndicator(sorted, ascending)}
        </button>
      </th>
    );
  }

  static #renderIndicator(sorted, ascending) {
    if (!sorted) return null;

    return (
      <>
        <span aria-hidden="true">{ascending ? ' ▲' : ' ▼'}</span>
        <span className="visually-hidden">{` (${t(ascending ? 'sort_ascending' : 'sort_descending')})`}</span>
      </>
    );
  }

  static #renderRow(row, columns, { onRowClick, onRowKeyDown }) {
    return (
      <tr
        key={row.id}
        role="link"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        data-testid={`statistics-domains-row-${row.id}`}
        onClick={() => onRowClick(row)}
        onKeyDown={(event) => onRowKeyDown(event, row)}
      >
        {columns.map(({ key, format }) => <td key={key}>{format(row[key])}</td>)}
      </tr>
    );
  }
}
