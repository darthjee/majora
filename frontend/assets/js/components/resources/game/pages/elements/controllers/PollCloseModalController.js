import PollClient from '../../../../../../client/PollClient.js';

/**
 * Manages the vote tally computation and close request for the
 * `PollCloseModal` confirmation dialog.
 */
export default class PollCloseModalController {
  /**
   * Tallies votes per option id.
   *
   * @param {{option: number}[]} votes - Every vote cast for the poll.
   * @returns {object} Map of option id to vote count.
   */
  static tallyVotes(votes) {
    return votes.reduce((tallies, vote) => {
      tallies[vote.option] = (tallies[vote.option] ?? 0) + 1;
      return tallies;
    }, {});
  }

  /**
   * Resolves which option id(s) currently hold the most votes. When no
   * option has any vote, every option ties at zero.
   *
   * @param {{id: number}[]} options - Poll options.
   * @param {object} tallies - Map of option id to vote count.
   * @returns {number[]} Option id(s) with the highest vote count.
   */
  static resolveMaxVoteOptionIds(options, tallies) {
    if (options.length === 0) {
      return [];
    }

    const counts = options.map((option) => tallies[option.id] ?? 0);
    const max = Math.max(...counts);

    return options
      .filter((option) => (tallies[option.id] ?? 0) === max)
      .map((option) => option.id);
  }

  /**
   * Resolves the auto-picked winner among a tied max-vote set: the lowest
   * option id, mirroring the backend's tie-break rule.
   *
   * @param {number[]} maxVoteOptionIds - Option id(s) with the highest vote count.
   * @returns {number|null} The auto-picked winner id, or `null` when there are no options.
   */
  static resolveEffectiveWinnerId(maxVoteOptionIds) {
    return maxVoteOptionIds.length === 0 ? null : Math.min(...maxVoteOptionIds);
  }

  /**
   * Creates a new PollCloseModalController instance.
   *
   * @param {PollClient|null} [pollClient] - Poll client override.
   */
  constructor(pollClient = null) {
    this.pollClient = pollClient ?? new PollClient();
  }

  /**
   * Fetches every vote cast for the poll and tallies them per option.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} pollId - Poll id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<object>} Map of option id to vote count.
   */
  fetchTallies(gameSlug, pollId, token) {
    return this.pollClient.fetchPollVotes(gameSlug, pollId, token)
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('votes failed'))))
      .then((votes) => PollCloseModalController.tallyVotes(votes));
  }

  /**
   * Submits the close request, invoking `onClosed` with the response payload
   * on success, or setting the `'error'` status otherwise.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} pollId - Poll id.
   * @param {string|null} token - Authentication token, if any.
   * @param {number|null} optionId - Explicit winning option id (override), or `null`
   *   to let the server auto-pick the winner.
   * @param {{setStatus: Function, onClosed: Function}} setters - Status setter and
   *   success callback.
   * @returns {Promise<void>} Resolves once the request settles.
   */
  async closePoll(gameSlug, pollId, token, optionId, setters) {
    setters.setStatus('submitting');

    try {
      const response = await this.pollClient.closePoll(gameSlug, pollId, token, optionId);

      if (!response.ok) {
        setters.setStatus('error');
        return;
      }

      const poll = await response.json();

      setters.setStatus('idle');
      setters.onClosed(poll);
    } catch {
      setters.setStatus('error');
    }
  }
}
