import { Table } from 'react-bootstrap';
import Translator from '../../../../../../i18n/Translator.js';
import Badge from '../../../../../common/badges/Badge.jsx';
import StatisticsBucketFormatter from '../../helpers/StatisticsBucketFormatter.js';
import StatisticsDateTimeFormatter from '../../helpers/StatisticsDateTimeFormatter.js';
import StatisticsDurationFormatter from '../../helpers/StatisticsDurationFormatter.js';
import statisticsHref from '../../helpers/statisticsHref.js';
import { sortHref } from '../../helpers/visitListSort.js';

const EMPTY = '—';
const OVERVIEW_PATH = '/staff/statistics';
const t = (key) => Translator.t(`staff_statistics_page.visit_list.${key}`);
const plain = (value) => value ?? EMPTY;
const count = (value) => StatisticsBucketFormatter.count(value);
const duration = (value) => StatisticsDurationFormatter.format(value);
const dateTime = (value) => StatisticsDateTimeFormatter.format(value);

/**
 * Columns of the Visit list table, in display order (after the User column).
 *
 * @description `sortKey` is the `sort` URL value of a sortable column; columns without one
 *   (IP, Domain) are plain headers. `ongoingBadge` marks the column whose cell carries the
 *   "ongoing" badge for a visit still in progress.
 * @type {{key: string, labelKey: string, format: Function, sortKey?: string,
 *   ongoingBadge?: boolean}[]}
 */
export const VISIT_LIST_COLUMNS = Object.freeze([
  { key: 'ip', labelKey: 'ip', format: plain },
  { key: 'domain', labelKey: 'domain', format: plain },
  { key: 'startedAt', labelKey: 'started_at', format: dateTime, sortKey: 'started_at' },
  {
    key: 'lastSeenAt', labelKey: 'last_seen', format: dateTime, sortKey: 'last_seen', ongoingBadge: true,
  },
  { key: 'durationSeconds', labelKey: 'duration', format: duration, sortKey: 'duration' },
  { key: 'hits', labelKey: 'hits', format: count, sortKey: 'hits' },
]);

/**
 * Rendering helper of the `StatisticsVisitListTable` element (issue #1523).
 */
export default class StatisticsVisitListTableHelper {
  /**
   * Renders the visit list table.
   *
   * @description A react-bootstrap `Table` (`hover`, `responsive`) with a User column and one
   *   header per column. Sortable headers are links to the same tab sorted by that column
   *   (server-side, always descending); the active one carries `aria-sort="descending"` and a
   *   visually hidden label. Rows are not clickable: a logged-in user's name links to the
   *   Overview tab filtered by that user, next to a profile link; an anonymous visit shows
   *   its session id.
   * @param {object} state - Table state.
   * @param {object[]} state.rows - Rows in API order (see `VisitListController.map`).
   * @param {string} state.sort - The current sort key.
   * @param {object} state.filters - Current statistics filters, carried into the links.
   * @returns {React.ReactElement} The table.
   */
  static render({ rows, sort, filters }) {
    return (
      <Table hover responsive data-testid="statistics-visit-list-table">
        <thead>
          <tr>
            <th scope="col">{t('user')}</th>
            {VISIT_LIST_COLUMNS.map((column) => StatisticsVisitListTableHelper.#renderHeader(column, sort, filters))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => StatisticsVisitListTableHelper.#renderRow(row, filters))}
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
          {StatisticsVisitListTableHelper.#renderIndicator(sorted)}
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

  static #renderRow(row, filters) {
    return (
      <tr key={row.id} data-testid={`statistics-visit-list-row-${row.id}`}>
        {StatisticsVisitListTableHelper.#renderUserCell(row, filters)}
        {VISIT_LIST_COLUMNS.map((column) => StatisticsVisitListTableHelper.#renderCell(column, row))}
      </tr>
    );
  }

  static #renderCell({ key, format, ongoingBadge }, row) {
    return (
      <td key={key}>
        {format(row[key])}
        {ongoingBadge ? StatisticsVisitListTableHelper.#renderOngoing(row.ongoing) : null}
      </td>
    );
  }

  static #renderOngoing(ongoing) {
    if (!ongoing) return null;

    return (
      <>
        {' '}
        <Badge variant="success" text={t('ongoing')} />
      </>
    );
  }

  static #renderUserCell(row, filters) {
    if (!row.user) return <td>{`${t('anonymous')} · #${row.sessionId}`}</td>;

    const { user } = row;

    return (
      <td>
        <a
          href={`#${statisticsHref(OVERVIEW_PATH, { ...filters, user: user.id })}`}
          className="fw-semibold"
          data-testid={`statistics-visit-list-user-${row.id}`}
        >
          {user.name}
        </a>
        {StatisticsVisitListTableHelper.#renderDisplayName(user.displayName)}
        <div className="small text-muted">{user.email}</div>
        <a href={`#/staff/users/${user.id}`} className="small" data-testid={`statistics-visit-list-profile-${row.id}`}>
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
