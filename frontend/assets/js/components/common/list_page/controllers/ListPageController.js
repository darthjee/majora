import GenericClient from '../../../../client/GenericClient.js';
import BasePageController from '../../base/controllers/BasePageController.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import listTypeConfig from '../../list_types/listTypeConfig.js';
import Noop from '../../../../utils/Noop.js';

const GENERIC_ERROR = 'Unable to load list.';

/**
 * Controller for the shared `ListPage` component, delegating data fetching to
 * `listTypeConfig[type].fetchList` instead of hardcoding a client call, so a single controller
 * implementation serves every list type migrated onto `ListPage`.
 */
export default class ListPageController extends BasePageController {
  /**
   * Create a list page controller.
   *
   * @param {string} type - List type, a key into `listTypeConfig`.
   * @param {string} gameSlug - Game slug the list is scoped to.
   * @param {Function} setItems - Raw list items setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {Function} [setCanEdit] - Can-edit flag setter, fed the permission `fetchList` resolves.
   * @param {GenericClient|null} [client] - Client override, mainly for tests.
   */
  constructor(
    type, gameSlug, setItems, setPagination, setLoading, setError, setCanEdit = Noop.noop, client = null,
  ) {
    super();
    this.type = type;
    this.gameSlug = gameSlug;
    this.setItems = setItems;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setCanEdit = setCanEdit;
    this.client = client ?? new GenericClient();
    this.hashResolver = new HashRouteResolver(() => this.client.currentHash());
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      safeSet(this.setLoading, true);

      listTypeConfig[this.type].fetchList(this.gameSlug, this.hashResolver, this.client)
        .then(({ data, pagination, canEdit }) => {
          safeSet(this.setItems, data);
          safeSet(this.setPagination, pagination);
          safeSet(this.setCanEdit, Boolean(canEdit));
        })
        .catch((error) => safeSet(this.setError, this.resolveError(error)))
        .finally(() => safeSet(this.setLoading, false));

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Resolve the error state for a failed fetch.
   *
   * @description Asks the list type's optional `resolveErrorMessage(error)` hook first (e.g.
   *   the games list turns `domain_not_recognized` into a warning), falling back to the generic
   *   'Unable to load list.' message when the hook is absent or returns nothing.
   * @param {Error} error - The error the list fetch rejected with.
   * @returns {string|{message: string, variant: string}} Error state for `ListPage`.
   */
  resolveError(error) {
    return listTypeConfig[this.type].resolveErrorMessage?.(error) || GENERIC_ERROR;
  }
}
