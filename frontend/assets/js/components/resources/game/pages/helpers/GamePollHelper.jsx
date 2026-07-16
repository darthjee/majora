import React from 'react';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import FieldErrors from '../../../../common/FieldErrors.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import PollOptionValue from '../elements/PollOptionValue.jsx';
import PollOptionVoteInput from '../elements/PollOptionVoteInput.jsx';

const DEFAULT_VOTE_STATE = { canVote: false, selectedOptionIds: [], voteStatus: 'idle' };

/**
 * Rendering helper for the Game Poll detail page.
 */
export default class GamePollHelper {
  /**
   * Render the poll detail view: title, description, type, status, and
   * either the read-only options list, or (for an `open` poll with options)
   * a votable checkbox/radio list plus a "Cast Vote(s)" submit button. The
   * vote controls and submit button are disabled for a viewer who cannot
   * vote (an admin who is not also a DM or player of the game).
   *
   * @param {object} poll - Poll data object.
   * @param {number} poll.id - Poll id.
   * @param {string} poll.title - Poll title.
   * @param {string} [poll.description] - Poll description text.
   * @param {string} poll.type - Poll type (`'single'` or `'multiple'`).
   * @param {string} poll.status - Poll status (`'open'`, `'inactive'`, or `'closed'`).
   * @param {string} poll.game_slug - Game slug the poll belongs to.
   * @param {string} [poll.option_type] - Poll option type (`'text'` or `'date'`), controlling
   *   how each option's value is displayed.
   * @param {{id: number, option: string}[]} [poll.options] - Poll options.
   * @param {object} [voteState] - Vote-related page state.
   * @param {boolean} [voteState.canVote] - Whether the viewer may cast a vote.
   * @param {number[]} [voteState.selectedOptionIds] - Currently selected option id(s).
   * @param {string} [voteState.voteStatus] - Vote submission status (`'idle'`,
   *   `'submitting'`, or `'error'`).
   * @param {object} [handlers] - Vote event handlers.
   * @param {Function} [handlers.onToggleOption] - Called with an option id when its
   *   control is toggled.
   * @param {Function} [handlers.onSubmit] - Called on submitting the vote form.
   * @returns {React.ReactElement} Poll detail element.
   */
  static render(poll, voteState = DEFAULT_VOTE_STATE, handlers = {}) {
    const options = poll.options ?? [];
    const isVotable = poll.status === 'open' && options.length > 0;

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
        {isVotable
          ? GamePollHelper.#renderVoteForm(options, poll, voteState, handlers)
          : GamePollHelper.#renderOptions(options, poll.option_type)}
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

  static #renderOptions(options, optionType) {
    if (options.length === 0) {
      return null;
    }

    return (
      <ul className="list-group">
        {options.map((option) => (
          <li key={option.id} className="list-group-item">
            <PollOptionValue optionType={optionType} value={option.option} />
          </li>
        ))}
      </ul>
    );
  }

  static #renderVoteForm(options, poll, voteState, handlers) {
    const { canVote, selectedOptionIds, voteStatus } = voteState;

    return (
      <form onSubmit={handlers.onSubmit}>
        <ul className="list-group">
          {options.map((option) => GamePollHelper.#renderVoteOption(
            option, poll, selectedOptionIds, canVote, handlers
          ))}
        </ul>
        {GamePollHelper.#renderVoteError(voteStatus)}
        <SubmitButton disabled={!canVote || voteStatus === 'submitting'}>
          {Translator.t(poll.type === 'multiple' ? 'game_poll_page.cast_votes' : 'game_poll_page.cast_vote')}
        </SubmitButton>
      </form>
    );
  }

  static #renderVoteOption(option, poll, selectedOptionIds, canVote, handlers) {
    const inputId = `game-poll-option-${option.id}`;

    return (
      <li key={option.id} className="list-group-item form-check">
        <PollOptionVoteInput
          id={inputId}
          dataTestId={inputId}
          pollType={poll.type}
          name={`game-poll-${poll.id}`}
          checked={selectedOptionIds.includes(option.id)}
          disabled={!canVote}
          onChange={() => handlers.onToggleOption(option.id)}
        />
        <label className="form-check-label" htmlFor={inputId}>
          <PollOptionValue optionType={poll.option_type} value={option.option} />
        </label>
      </li>
    );
  }

  static #renderVoteError(voteStatus) {
    if (voteStatus !== 'error') {
      return null;
    }

    return <FieldErrors errors={[Translator.t('game_poll_page.vote_error')]} />;
  }
}
