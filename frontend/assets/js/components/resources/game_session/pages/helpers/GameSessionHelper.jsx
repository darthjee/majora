import React from 'react';
import EditButton from '../../../../elements/EditButton.jsx';
import ErrorAlert from '../../../../elements/ErrorAlert.jsx';
import LoadingMessage from '../../../../elements/LoadingMessage.jsx';
import PageActions from '../../../../elements/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Session detail page.
 */
export default class GameSessionHelper {
  /**
   * Render the session detail view.
   *
   * @param {object} session - Session data object.
   * @param {number} session.id - Session id.
   * @param {string} session.title - Session title.
   * @param {string|null} [session.date] - Session date (YYYY-MM-DD), if any.
   * @param {string} session.game_slug - Game slug the session belongs to.
   * @param {boolean} [session.can_edit] - Whether the current user can edit this session.
   * @returns {React.ReactElement} Session detail element.
   */
  static render(session) {
    return (
      <div className="container mt-4">
        <PageActions backHref={`#/games/${session.game_slug}/sessions`}>
          {session.can_edit && (
            <EditButton href={`#/games/${session.game_slug}/sessions/${session.id}/edit`}>
              {Translator.t('game_session_page.edit')}
            </EditButton>
          )}
        </PageActions>
        <h1>{session.title}</h1>
        <p className="mt-3">
          {session.date ?? Translator.t('game_session_page.no_date')}
        </p>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('game_session_page.loading')} />;
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
}
