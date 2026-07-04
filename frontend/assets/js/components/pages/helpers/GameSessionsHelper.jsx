import React from 'react';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';
import NewButton from '../../elements/NewButton.jsx';
import PageActions from '../../elements/PageActions.jsx';
import Pagination from '../../elements/Pagination.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Sessions listing page.
 */
export default class GameSessionsHelper {
  /**
   * Render the sessions list with pagination and a back button.
   *
   * @param {object[]} sessions - List of session objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} backHref - Hash path to the parent game page.
   * @param {boolean} [canEdit] - Whether the current user may create new sessions.
   * @param {string} [newHref] - Hash path to the new session form.
   * @returns {React.ReactElement} Sessions list with pagination.
   */
  static render(sessions, pagination, basePath, backHref, canEdit = false, newHref = '') {
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
        <ul className="list-group mb-4">
          {sessions.map((session) => GameSessionsHelper.#renderSessionItem(session))}
        </ul>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
        />
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
