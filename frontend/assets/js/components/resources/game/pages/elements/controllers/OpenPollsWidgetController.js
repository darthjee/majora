import RequestStore from '../../../../../../utils/requests/RequestStore.js';

/**
 * Manages the open-polls count fetch for the OpenPollsWidget element.
 */
export default class OpenPollsWidgetController {
  /**
   * Creates a new OpenPollsWidgetController instance.
   *
   * @param {Function} setCount - state setter for the open polls count.
   * @param {Function} setLoading - state setter for the loading flag.
   */
  constructor(setCount, setLoading) {
    this.setCount = setCount;
    this.setLoading = setLoading;
  }

  /**
   * Build the widget mount effect, fetching the open polls count for the
   * game through {@link RequestStore.ensure} (issue #842), reading it off
   * the resolved pagination's `total` field (the same value the previous
   * `total` response header carried directly).
   *
   * @param {string} gameSlug - Game slug.
   * @returns {Function} Effect callback.
   */
  buildEffect(gameSlug) {
    return () => {
      let mounted = true;

      RequestStore.ensure({
        componentName: 'OpenPollsWidgetController',
        resource: 'poll',
        quantityType: 'collection',
        params: { gameSlug },
        query: { per_page: '1', status: 'open' },
      })
        .then(({ pagination }) => this.#handleResponse(pagination, mounted))
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

  #handleResponse(pagination, mounted) {
    if (!mounted) {
      return;
    }

    this.setCount(pagination.total);
  }
}
