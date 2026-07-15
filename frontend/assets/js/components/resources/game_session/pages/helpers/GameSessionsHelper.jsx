import React from 'react';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import NewButton from '../../../../common/NewButton.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Pagination from '../../../../common/Pagination.jsx';
import Translator from '../../../../../i18n/Translator.js';
import { SESSION_COLUMNS } from '../sessionColumns.js';

/**
 * Rendering helper for the Game Sessions listing page.
 */
export default class GameSessionsHelper {
  /**
   * Render the 3-column (past/future/unscheduled) sessions list with a back
   * button and, when allowed, a "New session" button.
   *
   * @param {object} columns - Map of column key to `{sessions, pagination}` state, keyed by
   *   `past`/`future`/`unscheduled` (see `sessionColumns.js`).
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the parent game page.
   * @param {boolean} [canEdit] - Whether the current user may create new sessions.
   * @param {string} [newHref] - Hash path to the new session form.
   * @returns {React.ReactElement} Sessions list with pagination.
   */
  static render(columns, basePath, backHref, canEdit = false, newHref = '') {
    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          {canEdit && (
            <NewButton href={newHref}>
              {Translator.t('game_sessions_page.new_session')}
            </NewButton>
          )}
        </PageActions>
        <h1 className="mb-4">{Translator.t('game_sessions_page.title')}</h1>
        <div className="row">
          {SESSION_COLUMNS.map((column) => GameSessionsHelper.#renderColumn(column, columns, basePath))}
        </div>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('game_sessions_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }

  static #renderColumn(column, columns, basePath) {
    const { sessions, pagination } = columns[column.key];

    return (
      <div key={column.key} className="col-md-4">
        <h2 className="h5">{Translator.t(`game_sessions_page.${column.key}`)}</h2>
        <ul className="list-group mb-4">
          {sessions.map((session) => GameSessionsHelper.#renderSessionItem(session))}
        </ul>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
          pageParam={column.pageParam}
          perPageParam={column.perPageParam}
          extraParams={GameSessionsHelper.#buildOtherColumnsParams(column.key, columns)}
        />
      </div>
    );
  }

  static #buildOtherColumnsParams(key, columns) {
    return SESSION_COLUMNS
      .filter((column) => column.key !== key)
      .reduce((params, column) => ({
        ...params,
        [column.pageParam]: columns[column.key].pagination.page,
        [column.perPageParam]: columns[column.key].pagination.perPage,
      }), {});
  }

  static #renderSessionItem(session) {
    return (
      <li key={session.id} className="list-group-item d-flex justify-content-between align-items-center">
        <a href={`#/games/${session.game_slug}/sessions/${session.id}`}>
          {session.title}
        </a>
        <span className="text-muted">
          {session.date ?? Translator.t('game_session_page.no_date')}
        </span>
      </li>
    );
  }
}
