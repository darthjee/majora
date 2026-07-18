import React from 'react';
import Avatar from '../../../../common/misc/Avatar.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import FieldErrors from '../../../../common/forms/FieldErrors.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import PageActions from '../../../../common/list_page/PageActions.jsx';
import SubmitButton from '../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../i18n/Translator.js';
import PollOptionValue from '../elements/PollOptionValue.jsx';
import PollOptionVoteInput from '../elements/PollOptionVoteInput.jsx';

const DEFAULT_VOTE_STATE = { canVote: false, selectedOptionIds: [], voteStatus: 'idle' };
const DEFAULT_CLOSE_STATE = { canClose: false };
const DEFAULT_VOTES_PAYLOAD = { votes_count: [], users: [], votes: [] };

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
   * @param {Function} [handlers.onOpenCloseModal] - Called when the "Close Poll" button
   *   is clicked, to open the close confirmation modal.
   * @param {object} [closeState] - Close-related page state.
   * @param {boolean} [closeState.canClose] - Whether the viewer may close the poll (DM
   *   or superuser).
   * @param {object} [votesPayload] - Full, unfiltered votes payload for the poll.
   * @param {{option: number, count: number}[]} [votesPayload.votes_count] - Vote count per
   *   option, one entry per option (including zero-vote ones).
   * @param {{id: number, name: string, avatar_url: string|null}[]} [votesPayload.users] - Users
   *   who cast at least one vote.
   * @param {{id: number, option: number, user_id: number}[]} [votesPayload.votes] - Individual
   *   vote rows, joining an option to the user who cast it.
   * @returns {React.ReactElement} Poll detail element.
   */
  static render(
    poll,
    voteState = DEFAULT_VOTE_STATE,
    handlers = {},
    closeState = DEFAULT_CLOSE_STATE,
    votesPayload = DEFAULT_VOTES_PAYLOAD
  ) {
    const options = poll.options ?? [];
    const isVotable = poll.status === 'open' && options.length > 0;
    const voteMaps = GamePollHelper.#buildVoteMaps(votesPayload ?? DEFAULT_VOTES_PAYLOAD);

    return (
      <div className="container mt-4">
        <PageActions backHref={`#/games/${poll.game_slug}/polls`}>
          {GamePollHelper.#renderCloseButton(poll, closeState.canClose, handlers)}
        </PageActions>
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
          ? GamePollHelper.#renderVoteForm(options, poll, voteState, handlers, voteMaps)
          : GamePollHelper.#renderOptions(options, poll.option_type, voteMaps)}
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

  static #renderCloseButton(poll, canClose, handlers) {
    if (!canClose || poll.status !== 'open') {
      return null;
    }

    return (
      <button type="button" className="btn btn-outline-danger mb-3" onClick={handlers.onOpenCloseModal}>
        {Translator.t('game_poll_page.close_button')}
      </button>
    );
  }

  /**
   * Build per-render lookups from the votes payload: user records by id, vote counts by
   * option id, and the list of voter user ids per option id. Built once per `render()`
   * call so `#renderOptions`/`#renderVoteForm` avoid re-scanning the payload's arrays
   * per option.
   *
   * @param {object} votesPayload - Votes payload, as documented on `render`.
   * @returns {{usersById: Map, countsByOption: Map, voterIdsByOption: Map}} Lookup maps.
   */
  static #buildVoteMaps(votesPayload) {
    const usersById = new Map((votesPayload.users ?? []).map((user) => [user.id, user]));
    const countsByOption = new Map((votesPayload.votes_count ?? []).map((entry) => [entry.option, entry.count]));
    const voterIdsByOption = new Map();

    (votesPayload.votes ?? []).forEach((vote) => {
      const voterIds = voterIdsByOption.get(vote.option) ?? [];

      voterIds.push(vote.user_id);
      voterIdsByOption.set(vote.option, voterIds);
    });

    return { usersById, countsByOption, voterIdsByOption };
  }

  static #renderVoteCount(optionId, voteMaps) {
    const count = voteMaps.countsByOption.get(optionId) ?? 0;

    return (
      <span className="badge bg-secondary ms-2">
        {Translator.t('game_poll_page.votes_count_label')}: {count}
      </span>
    );
  }

  static #renderVoters(optionId, voteMaps) {
    const voterIds = voteMaps.voterIdsByOption.get(optionId) ?? [];

    if (voterIds.length === 0) {
      return null;
    }

    return (
      <span className="ms-2">
        {voterIds.map((userId) => {
          const user = voteMaps.usersById.get(userId);

          return <Avatar key={userId} url={user?.avatar_url} alt={user?.name} />;
        })}
      </span>
    );
  }

  static #renderOptions(options, optionType, voteMaps) {
    if (options.length === 0) {
      return null;
    }

    return (
      <ul className="list-group">
        {options.map((option) => (
          <li key={option.id} className="list-group-item d-flex justify-content-between align-items-center">
            <span className="d-flex align-items-center">
              <PollOptionValue optionType={optionType} value={option.option} />
              {GamePollHelper.#renderVoters(option.id, voteMaps)}
            </span>
            <span className="d-flex align-items-center">
              {GamePollHelper.#renderWinnerBadge(option)}
              {GamePollHelper.#renderVoteCount(option.id, voteMaps)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  static #renderWinnerBadge(option) {
    if (!option.selected) {
      return null;
    }

    return <span className="badge bg-success ms-2">{Translator.t('game_poll_page.winner_badge')}</span>;
  }

  static #renderVoteForm(options, poll, voteState, handlers, voteMaps) {
    const { canVote, selectedOptionIds, voteStatus } = voteState;

    return (
      <form onSubmit={handlers.onSubmit}>
        <ul className="list-group">
          {options.map((option) => GamePollHelper.#renderVoteOption(
            option, poll, selectedOptionIds, canVote, handlers, voteMaps
          ))}
        </ul>
        {GamePollHelper.#renderVoteError(voteStatus)}
        <SubmitButton disabled={!canVote || voteStatus === 'submitting'}>
          {Translator.t(poll.type === 'multiple' ? 'game_poll_page.cast_votes' : 'game_poll_page.cast_vote')}
        </SubmitButton>
      </form>
    );
  }

  static #renderVoteOption(option, poll, selectedOptionIds, canVote, handlers, voteMaps) {
    const inputId = `game-poll-option-${option.id}`;

    return (
      <li key={option.id} className="list-group-item form-check d-flex justify-content-between align-items-center">
        <span className="d-flex align-items-center">
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
          {GamePollHelper.#renderVoters(option.id, voteMaps)}
        </span>
        {GamePollHelper.#renderVoteCount(option.id, voteMaps)}
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
