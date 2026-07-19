import PollClient from '../../../../../../client/PollClient.js';
import AuthStorage from '../../../../../../utils/auth/AuthStorage.js';
import parsePositiveInt from '../../../../../../utils/parsePositiveInt.js';

/**
 * Manages the open-polls count fetch for the OpenPollsWidget element.
 */
export default class OpenPollsWidgetController {
  /**
   * Creates a new OpenPollsWidgetController instance.
   *
   * @param {Function} setCount - state setter for the open polls count.
   * @param {Function} setLoading - state setter for the loading flag.
   * @param {PollClient|null} [pollClient] - Poll client override.
   */
  constructor(setCount, setLoading, pollClient = null) {
    this.setCount = setCount;
    this.setLoading = setLoading;
    this.pollClient = pollClient ?? new PollClient();
  }

  /**
   * Build the widget mount effect, fetching the open polls count for the
   * game and reading it off the `total` response header (not the body).
   *
   * @param {string} gameSlug - Game slug.
   * @returns {Function} Effect callback.
   */
  buildEffect(gameSlug) {
    return () => {
      let mounted = true;
      const token = AuthStorage.getToken();
      const params = new URLSearchParams({ per_page: '1', status: 'open' });

      this.pollClient.fetchPolls(gameSlug, token, params)
        .then((response) => this.#handleResponse(response, mounted))
        .catch(() => {
          if (mounted) {
            this.setCount(0);
          }
        })
        .finally(() => {
          if (mounted) {
            this.setLoading(false);
          }
        });

      return () => {
        mounted = false;
      };
    };
  }

  #handleResponse(response, mounted) {
    if (!mounted) {
      return;
    }

    if (!response.ok) {
      this.setCount(0);
      return;
    }

    this.setCount(parsePositiveInt(response.headers.get('total'), 0));
  }
}
