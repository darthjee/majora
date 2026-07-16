import BaseClient from './BaseClient.js';

/**
 * HTTP client for game poll requests (list, detail, and create).
 */
export default class PollClient extends BaseClient {
  /**
   * Fetches the paginated list of polls for a game. Always sends
   * `X-Skip-Cache: true`, since the response is identity-gated (it reflects
   * the requester's own votes/permissions) and the `/games/<slug>/polls.json`
   * path cannot be expressed as a static skip-cache suffix.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {URLSearchParams} [params] - Pagination/filter query params.
   * @returns {Promise<Response>} fetch response from the game polls index endpoint.
   */
  fetchPolls(gameSlug, token, params = new URLSearchParams()) {
    const query = params.toString();
    const path = query ? `/games/${gameSlug}/polls.json?${query}` : `/games/${gameSlug}/polls.json`;

    return this.getJson(path, token, { 'X-Skip-Cache': 'true' });
  }

  /**
   * Fetches the details of a game poll, including its options. Always sends
   * `X-Skip-Cache: true`, since the response is identity-gated (it reflects
   * the requester's own votes/permissions) and the numeric poll id in
   * `/games/<slug>/polls/<id>.json` cannot be expressed as a static
   * skip-cache suffix.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Poll id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the poll endpoint.
   */
  fetchPoll(gameSlug, id, token) {
    return this.getJson(`/games/${gameSlug}/polls/${id}.json`, token, { 'X-Skip-Cache': 'true' });
  }

  /**
   * Creates a new poll (and its options) for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields for the new poll.
   * @param {string} fields.title - Poll title.
   * @param {string} [fields.description] - Poll description.
   * @param {string} fields.type - Poll type (`'single'` or `'multiple'`).
   * @param {string} [fields.option_type] - Poll option type (`'text'` or `'date'`),
   *   optional, defaulting server-side to `'text'` when omitted.
   * @param {{option: string}[]} fields.options - Poll options.
   * @returns {Promise<Response>} fetch response from the game polls endpoint.
   */
  createPoll(gameSlug, token, fields) {
    return this.postJson(`/games/${gameSlug}/polls.json`, token, fields);
  }

  /**
   * Fetches votes cast for a poll, optionally filtered to a single user.
   * Always sends `X-Skip-Cache: true`, since the response is identity-gated
   * and the numeric poll id in `/games/<slug>/polls/<id>/votes.json` cannot
   * be expressed as a static skip-cache suffix.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} pollId - Poll id.
   * @param {string|null} token - Authentication token, if any.
   * @param {URLSearchParams} [params] - Query params, e.g. `user_id` to filter to one voter.
   * @returns {Promise<Response>} fetch response from the poll votes endpoint, whose JSON body
   *   resolves to `{votes_count: [{option, count}], users: [{id, name, avatar_url}],
   *   votes: [{id, option, user_id}]}`. `votes_count` always lists every poll option
   *   (including zero-vote ones), regardless of `params`; `users` and `votes` are scoped by
   *   `params` (e.g. `user_id`) the same way as before.
   */
  fetchPollVotes(gameSlug, pollId, token, params = new URLSearchParams()) {
    const query = params.toString();
    const path = query
      ? `/games/${gameSlug}/polls/${pollId}/votes.json?${query}`
      : `/games/${gameSlug}/polls/${pollId}/votes.json`;

    return this.getJson(path, token, { 'X-Skip-Cache': 'true' });
  }

  /**
   * Casts the requesting user's vote(s) for a poll, replacing any previous
   * vote(s) they had for it. Always sends `X-Skip-Cache: true`, mirroring
   * `fetchPollVotes`.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} pollId - Poll id.
   * @param {string|null} token - Authentication token, if any.
   * @param {number[]} optionIds - Full set of option ids being cast for this poll.
   * @returns {Promise<Response>} fetch response from the poll votes endpoint, whose JSON body
   *   resolves to a flat array of `{id, option, user_id}` vote objects (not wrapped in the
   *   envelope used by `fetchPollVotes`).
   */
  castPollVotes(gameSlug, pollId, token, optionIds) {
    return this.putJson(
      `/games/${gameSlug}/polls/${pollId}/votes.json`,
      token,
      { option_ids: optionIds },
      { 'X-Skip-Cache': 'true' }
    );
  }

  /**
   * Closes a poll, marking it `closed` and recording its winning option.
   * Always sends `X-Skip-Cache: true`, mirroring `fetchPollVotes`.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} pollId - Poll id.
   * @param {string|null} token - Authentication token, if any.
   * @param {number|null} [optionId] - Explicit winning option id (override); when omitted or
   *   `null`, the server auto-picks the winner (highest vote count, first by id on a tie).
   * @returns {Promise<Response>} fetch response from the poll close endpoint.
   */
  closePoll(gameSlug, pollId, token, optionId = null) {
    return this.patchJson(
      `/games/${gameSlug}/polls/${pollId}/close.json`,
      token,
      optionId !== null ? { option_id: optionId } : {},
      { 'X-Skip-Cache': 'true' }
    );
  }
}
