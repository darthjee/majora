import React from 'react';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the Game Poll detail page.
 */
export default class GamePollHelper {
  /**
   * Render the poll detail view: title, description, type, status, and the
   * read-only list of options (voting is out of scope).
   *
   * @param {object} poll - Poll data object.
   * @param {number} poll.id - Poll id.
   * @param {string} poll.title - Poll title.
   * @param {string} [poll.description] - Poll description text.
   * @param {string} poll.type - Poll type (`'single'` or `'multiple'`).
   * @param {string} poll.status - Poll status (`'open'`, `'inactive'`, or `'closed'`).
   * @param {string} poll.game_slug - Game slug the poll belongs to.
   * @param {{id: number, option: string}[]} [poll.options] - Poll options.
   * @returns {React.ReactElement} Poll detail element.
   */
  static render(poll) {
    const options = poll.options ?? [];

    return (
      <div className="container mt-4">
        <PageActions backHref={`#/games/${poll.game_slug}/polls`} />
        <h1>{poll.title}</h1>
        <p className="mt-3">
          <span className="badge bg-secondary me-2">
            {Translator.t(`game_poll_new_page.type_${poll.type}`)}
          </span>
          <span className="badge bg-secondary">
            {Translator.t(`game_polls_page.status_${poll.status}`)}
          </span>
        </p>
        {poll.description && (
          <p className="mt-3 text-pre-wrap">{poll.description}</p>
        )}
        <h2 className="h5 mt-4">{Translator.t('game_poll_page.options_title')}</h2>
        {GamePollHelper.#renderOptions(options)}
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('game_poll_page.loading')} />;
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

  static #renderOptions(options) {
    if (options.length === 0) {
      return null;
    }

    return (
      <ul className="list-group">
        {options.map((option) => (
          <li key={option.id} className="list-group-item">{option.option}</li>
        ))}
      </ul>
    );
  }
}
