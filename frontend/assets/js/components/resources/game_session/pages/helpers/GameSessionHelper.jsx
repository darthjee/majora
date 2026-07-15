import React from 'react';
import EditButton from '../../../../common/EditButton.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import SessionMessagesHelper from './SessionMessagesHelper.jsx';
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
   * @param {string} [session.description] - Session description text.
   * @param {{messages: Array, nextEntryId: (number|string|null), loadingMore: boolean,
   *   content: string, posting: boolean, fieldErrors: object}} [messagesState] - Session
   *   messages section state.
   * @param {{onLoadMore: Function, onContentChange: Function, onSubmit: Function}} [messagesHandlers] -
   *   Session messages section event handlers.
   * @returns {React.ReactElement} Session detail element.
   */
  static render(session, messagesState, messagesHandlers) {
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
        {session.description && (
          <p className="mt-3 text-pre-wrap">{session.description}</p>
        )}
        {SessionMessagesHelper.render(messagesState, messagesHandlers)}
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
