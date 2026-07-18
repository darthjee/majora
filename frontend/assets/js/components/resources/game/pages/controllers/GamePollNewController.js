import PollClient from '../../../../../client/PollClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the game poll creation page.
 *
 * @description Gated the same way as `GamePollsController`: creating a poll
 *   shares the same audience as viewing one (the game's DM(s), players, and
 *   admins), redirecting to the polls list for anyone else.
 */
export default class GamePollNewController extends BasePageController {
  /**
   * Extract game slug from a poll creation hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromPollNewHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/polls/new', 'game_slug', hash);
  }

  /**
   * Handles typing into an option field, updating its value and appending a
   * new blank entry after it when the edited entry is the last one and just
   * became non-blank, so there is always exactly one blank entry at the end.
   *
   * @param {number} index - Index of the option being edited.
   * @param {string} value - New value for the option.
   * @param {string[]} options - Current options array.
   * @param {Function} setOptions - Options setter.
   * @returns {void}
   */
  static handleOptionChange(index, value, options, setOptions) {
    const updated = options.map((option, i) => (i === index ? value : option));
    const isLast = index === options.length - 1;

    if (isLast && value.trim() !== '') {
      setOptions([...updated, '']);
      return;
    }

    setOptions(updated);
  }

  /**
   * Removes an option entry from the options array.
   *
   * @param {number} index - Index of the option to remove.
   * @param {string[]} options - Current options array.
   * @param {Function} setOptions - Options setter.
   * @returns {void}
   */
  static handleOptionRemove(index, options, setOptions) {
    setOptions(options.filter((_option, i) => i !== index));
  }

  /**
   * Create a game poll new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {PollClient|null} [pollClient] - Poll client override.
   */
  constructor(setError, setFieldErrors = Noop.noop, pollClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.pollClient = pollClient ?? new PollClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user is
   *   a DM, player, or admin of the game and redirects to the polls list
   *   when they are not.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const gameSlug = GamePollNewController.getGameSlugFromPollNewHash(hash);

      AccessStore.ensureGameAccess(gameSlug)
        .then((access) => this.#redirectIfNotAllowed(access, gameSlug))
        .catch(() => this.#redirectToPolls(gameSlug));
    };
  }

  /**
   * Submit the new poll form.
   *
   * @description Prevents the default form submission, resets field errors,
   *   filters out blank options, sends a POST request, then redirects to
   *   the new poll's detail page on success, sets field errors on 400, or
   *   sets error status on other failures.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{title: string, description: string, type: string, option_type: string,
   *   options: string[]}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const token = AuthStorage.getToken();

    try {
      const response = await this.pollClient.createPoll(gameSlug, token, {
        title: formValues.title,
        description: formValues.description,
        type: formValues.type,
        option_type: formValues.option_type,
        options: formValues.options
          .filter((option) => option.trim() !== '')
          .map((option) => ({ option })),
      });

      await this.#handleResponse(response, gameSlug, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  #redirectIfNotAllowed(access, gameSlug) {
    if (!GamePollNewController.#isAllowed(access)) {
      this.#redirectToPolls(gameSlug);
    }
  }

  static #isAllowed(access) {
    return Boolean(access.is_dm || access.is_player || access.is_superuser || access.is_staff);
  }

  #redirectToPolls(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/polls`;
    }
  }

  async #handleResponse(response, gameSlug, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/polls/${data.id}`;
      }
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setStatus('error');
  }
}
