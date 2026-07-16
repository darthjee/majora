import PollClient from '../../../../../client/PollClient.js';
import AuthClient from '../../../../../client/AuthClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game poll detail page.
 *
 * @description Gated the same way as `GamePollsController`: visible to the
 *   game's DM(s), players, and admins, redirecting to the game page for
 *   anyone else, before ever calling the poll endpoint (which would
 *   otherwise 401/403). Also resolves whether the viewer can vote (DM or
 *   player, not a pure admin) and, when they can, pre-fetches their current
 *   vote(s) for the poll to pre-populate the selection. Also resolves
 *   whether the viewer can close the poll (DM or superuser only, narrower
 *   than the voting rule).
 */
export default class GamePollController extends BasePageController {
  /**
   * Extract game slug and poll id from a poll detail hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, id: string}} Poll route params.
   */
  static getPollParamsFromHash(hash = '') {
    return BasePageController.extractParams('/games/:game_slug/polls/:id', hash, ['game_slug', 'id']);
  }

  /**
   * Toggles an option id within the current vote selection, according to
   * the poll type: a `single`-type poll replaces the selection outright
   * (radio semantics), a `multiple`-type poll adds/removes the id from the
   * current selection (checkbox semantics).
   *
   * @param {string} pollType - Poll type (`'single'` or `'multiple'`).
   * @param {number} optionId - Option id being toggled.
   * @param {number[]} selectedOptionIds - Current selection.
   * @returns {number[]} Updated selection.
   */
  static toggleSelection(pollType, optionId, selectedOptionIds) {
    if (pollType === 'single') {
      return [optionId];
    }

    return selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId];
  }

  /**
   * Create a game poll controller.
   *
   * @param {Function} setPoll - Poll setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {PollClient|null} [pollClient] - Poll client override.
   * @param {Function} [setCanVote] - Setter for whether the viewer can vote (DM or player).
   * @param {Function} [setCanClose] - Setter for whether the viewer can close the poll
   *   (DM or superuser only, narrower than `setCanVote`).
   * @param {Function} [setSelectedOptionIds] - Setter for the pre-populated/current selection.
   * @param {Function} [setVotesPayload] - Setter for the full, unfiltered votes payload
   *   (`{votes_count, users, votes}`), fetched unconditionally for every allowed viewer.
   * @param {AuthClient|null} [authClient] - Auth client override, used to resolve the
   *   current user's id before pre-fetching their vote(s).
   */
  constructor(
    setPoll,
    setLoading,
    setError,
    pollClient = null,
    setCanVote = Noop.noop,
    setCanClose = Noop.noop,
    setSelectedOptionIds = Noop.noop,
    setVotesPayload = Noop.noop,
    authClient = null
  ) {
    super();
    this.setPoll = setPoll;
    this.setLoading = setLoading;
    this.setError = setError;
    this.pollClient = pollClient ?? new PollClient();
    this.setCanVote = setCanVote;
    this.setCanClose = setCanClose;
    this.setSelectedOptionIds = setSelectedOptionIds;
    this.setVotesPayload = setVotesPayload;
    this.authClient = authClient ?? new AuthClient();
  }

  /**
   * Build the page mount effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const { game_slug: gameSlug, id } = GamePollController.getPollParamsFromHash(hash);

      if (!gameSlug || !id) {
        safeSet(this.setError, 'Unable to load poll.');
        safeSet(this.setLoading, false);
      } else {
        AccessStore.ensureGameAccess(gameSlug)
          .then((access) => this.#handleAccess(access, gameSlug, id, safeSet))
          .catch(() => this.#redirectToGame(gameSlug));
      }

      return () => {
        mounted = false;
      };
    };
  }

  static #isAllowed(access) {
    return Boolean(access.is_dm || access.is_player || access.is_superuser || access.is_staff);
  }

  static #canVote(access) {
    return Boolean(access.is_dm || access.is_player);
  }

  static #canClose(access) {
    return Boolean(access.is_dm || access.is_superuser);
  }

  #handleAccess(access, gameSlug, id, safeSet) {
    if (!GamePollController.#isAllowed(access)) {
      this.#redirectToGame(gameSlug);
      return;
    }

    const canVote = GamePollController.#canVote(access);

    safeSet(this.setCanVote, canVote);
    safeSet(this.setCanClose, GamePollController.#canClose(access));
    this.#fetchPoll(gameSlug, id, safeSet);
    this.#fetchVotesPayload(gameSlug, id, safeSet);

    if (canVote) {
      this.#fetchCurrentVotes(gameSlug, id, safeSet);
    }
  }

  #redirectToGame(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}`;
    }
  }

  #fetchPoll(gameSlug, id, safeSet) {
    const token = AuthStorage.getToken();

    this.pollClient.fetchPoll(gameSlug, id, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('poll failed'))))
      .then((poll) => safeSet(this.setPoll, { ...poll, game_slug: gameSlug }))
      .catch(() => safeSet(this.setError, 'Unable to load poll.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Fetches the full, unfiltered votes payload (`{votes_count, users, votes}`) for the
   * poll, for every viewer allowed onto the page (mirrors `#fetchPoll`, unlike
   * `#fetchCurrentVotes`, which is gated by `canVote`). Silently no-ops on failure,
   * leaving the payload unset.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} id - Poll id.
   * @param {Function} safeSet - Mount-aware setter wrapper.
   * @returns {void}
   */
  #fetchVotesPayload(gameSlug, id, safeSet) {
    const token = AuthStorage.getToken();

    this.pollClient.fetchPollVotes(gameSlug, id, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('votes failed'))))
      .then((payload) => safeSet(this.setVotesPayload, payload))
      .catch(Noop.noop);
  }

  /**
   * Pre-fetches the current user's existing vote(s) for the poll, so the
   * page can pre-populate the selected option(s). Resolves the current
   * user's id from `/users/status.json`, then filters the votes fetch to
   * that user. Silently no-ops on failure, leaving the selection empty.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} id - Poll id.
   * @param {Function} safeSet - Mount-aware setter wrapper.
   * @returns {void}
   */
  #fetchCurrentVotes(gameSlug, id, safeSet) {
    const token = AuthStorage.getToken();

    this.authClient.status(token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('status failed'))))
      .then((data) => this.pollClient.fetchPollVotes(
        gameSlug, id, token, new URLSearchParams({ user_id: String(data.user_id) })
      ))
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('votes failed'))))
      .then((payload) => safeSet(this.setSelectedOptionIds, payload.votes.map((vote) => vote.option)))
      .catch(Noop.noop);
  }

  /**
   * Casts the current user's vote(s) for the poll, then refreshes the
   * selection from the response on success.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Poll id.
   * @param {number[]} optionIds - Full set of option ids being cast.
   * @param {{setSelectedOptionIds: Function, setVoteStatus: Function}} setters - State setters.
   * @returns {Promise<void>} Resolves when the vote request settles.
   */
  async castVotes(gameSlug, id, optionIds, setters) {
    setters.setVoteStatus('submitting');

    const token = AuthStorage.getToken();

    try {
      const response = await this.pollClient.castPollVotes(gameSlug, id, token, optionIds);

      if (!response.ok) {
        setters.setVoteStatus('error');
        return;
      }

      const votes = await response.json();

      setters.setSelectedOptionIds(votes.map((vote) => vote.option));
      setters.setVoteStatus('idle');
    } catch {
      setters.setVoteStatus('error');
    }
  }
}
