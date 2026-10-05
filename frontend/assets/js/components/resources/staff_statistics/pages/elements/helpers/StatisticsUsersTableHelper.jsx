import { Table } from 'react-bootstrap';
import Translator from '../../../../../../i18n/Translator.js';
import StatisticsBucketFormatter from '../../helpers/StatisticsBucketFormatter.js';
import StatisticsDurationFormatter from '../../helpers/StatisticsDurationFormatter.js';
import { sortHref } from '../../helpers/usersSort.js';

const EMPTY = '—';
const DATE_TIME_OPTIONS = { dateStyle: 'medium', timeStyle: 'short' };
const t = (key) => Translator.t(`staff_statistics_page.users.${key}`);
const count = (value) => StatisticsBucketFormatter.count(value);
const duration = (value) => StatisticsDurationFormatter.format(value);

/**
 * Formats an ISO timestamp as a date and time in the browser's zone.
 *
 * @param {?string} value - ISO 8601 timestamp.
 * @returns {string} The formatted date and time, or a dash when missing.
 */
export function formatLastSeen(value) {
  if (!value) return EMPTY;

  return new Intl.DateTimeFormat(undefined, DATE_TIME_OPTIONS).format(new Date(value));
}

/**
 * Metric columns of the Users table, in display order (after the User column).
 *
 * @description `sortKey` is the `sort` URL value of a sortable column; columns without one
 *   (Domains) are plain headers.
 * @type {{key: string, labelKey: string, format: Function, sortKey?: string}[]}
 */
export const USERS_COLUMNS = Object.freeze([
  { key: 'visits', labelKey: 'visits', format: count, sortKey: 'visits' },
  { key: 'timeOnSiteSeconds', labelKey: 'time_on_site', format: duration, sortKey: 'time_on_site' },
  {
    key: 'averageDurationSeconds', labelKey: 'average_duration', format: duration, sortKey: 'average_duration',
  },
  { key: 'hits', labelKey: 'hits', format: count, sortKey: 'hits' },
  { key: 'domains', labelKey: 'domains', format: (labels) => (labels.length ? labels.join(', ') : EMPTY) },
  { key: 'lastSeenAt', labelKey: 'last_seen', format: formatLastSeen, sortKey: 'last_seen' },
]);

/**
 * Rendering helper of the `StatisticsUsersTable` element (issue #1520).
 */
export default class StatisticsUsersTableHelper {
  /**
   * Renders the users ranking table.
   *
   * @description A react-bootstrap `Table` (`hover`, `responsive`) with a User column and one
   *   header per metric. Sortable headers are links to the same tab sorted by that column
   *   (server-side, always descending); the active one carries `aria-sort="descending"` and a
   *   visually hidden label. Each row is a link opening the Overview tab for that user; its
   *   User cell has a separate profile link.
   * @param {object} state - Table state.
   * @param {object[]} state.rows - Rows in API order (see `UsersController.map`).
   * @param {string} state.sort - The current sort key.
   * @param {object} state.filters - Current statistics filters, carried into the header links.
   * @param {object} handlers - Event handlers.
   * @param {Function} handlers.onRowClick - Called with a row on row click.
   * @param {Function} handlers.onRowKeyDown - Called with the event and a row on row key down.
   * @returns {React.ReactElement} The table.
   */
  static render({ rows, sort, filters }, handlers) {
    return (
      <Table hover responsive data-testid="statistics-users-table">
        <thead>
          <tr>
            <th scope="col">{t('user')}</th>
            {USERS_COLUMNS.map((column) => StatisticsUsersTableHelper.#renderHeader(column, sort, filters))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => StatisticsUsersTableHelper.#renderRow(row, handlers))}
        </tbody>
      </Table>
    );
  }

  static #renderHeader({ key, labelKey, sortKey }, sort, filters) {
    if (!sortKey) return <th key={key} scope="col">{t(labelKey)}</th>;

    const sorted = sort === sortKey;

    return (
      <th key={key} scope="col" aria-sort={sorted ? 'descending' : 'none'}>
        <a href={`#${sortHref(filters, sortKey)}`} className="text-reset fw-bold">
          {t(labelKey)}
          {StatisticsUsersTableHelper.#renderIndicator(sorted)}
        </a>
      </th>
    );
  }

  static #renderIndicator(sorted) {
    if (!sorted) return null;

    return (
      <>
        <span aria-hidden="true">{' ▼'}</span>
        <span className="visually-hidden">{` (${t('sorted_descending')})`}</span>
      </>
    );
  }

  static #renderRow(row, { onRowClick, onRowKeyDown }) {
    return (
      <tr
        key={row.id}
        role="link"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        data-testid={`statistics-users-row-${row.id}`}
        onClick={() => onRowClick(row)}
        onKeyDown={(event) => onRowKeyDown(event, row)}
      >
        {StatisticsUsersTableHelper.#renderUserCell(row)}
        {USERS_COLUMNS.map(({ key, format }) => <td key={key}>{format(row[key])}</td>)}
      </tr>
    );
  }

  static #renderUserCell(row) {
    return (
      <td>
        <div className="fw-semibold">{row.name}</div>
        {StatisticsUsersTableHelper.#renderDisplayName(row.displayName)}
        <div className="small text-muted">{row.email}</div>
        <a
          href={`#/staff/users/${row.id}`}
          className="small"
          data-testid={`statistics-users-profile-${row.id}`}
          onClick={(event) => event.stopPropagation()}
        >
          {t('profile')}
        </a>
      </td>
    );
  }

  static #renderDisplayName(displayName) {
    if (!displayName) return null;

    return <div className="small text-muted">{displayName}</div>;
  }
}
