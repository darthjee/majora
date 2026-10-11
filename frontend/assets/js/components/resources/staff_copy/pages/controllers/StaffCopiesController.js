import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import StaffCopyUrl from '../helpers/StaffCopyUrl.js';

const COMPONENT_NAME = 'StaffCopiesController';
const RESOURCE = 'staffCopy';
const LOAD_ERROR_KEY = 'staff_copies_page.error';
const SAME_GAME_ERROR_KEY = 'staff_copies_page.same_game_error';

/**
 * Controller for the staff copy page (issue #1571).
 *
 * @description Gates the page to staff/superusers, loads the copy types and the games in
 *   parallel, resolves the `type`/`from`/`to` selection from the hash query (a stale type falls
 *   back to the first one, unknown games are dropped) and lists the copyable rows of the active
 *   type once both games are selected and differ. Every state update goes through a safe setter
 *   so updates landing after unmount are ignored. Error state holds i18n keys, translated at
 *   render time.
 */
export default class StaffCopiesController extends BasePageController {
  /**
   * Create a staff copy controller.
   *
   * @param {object} setters - React state setters.
   * @param {Function} setters.setTypes - Available copy types setter.
   * @param {Function} setters.setGames - Available games setter.
   * @param {Function} setters.setSelection - Resolved `{type, from, to}` selection setter.
   * @param {Function} setters.setRows - Source rows setter.
   * @param {Function} setters.setPagination - Pagination setter.
   * @param {Function} setters.setLoading - Loading flag setter.
   * @param {Function} setters.setError - Load error (i18n key) setter.
   * @param {Function} setters.setListError - List load / validation error (i18n key) setter.
   */
  constructor(setters) {
    super();
    Object.assign(this, setters);
    this.selection = { type: '', from: '', to: '' };
    this.mounted = false;
    this.safeSet = this.buildSafeSetter(() => this.mounted);
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects non-staff/non-superusers to the home page; otherwise loads the copy
   *   types and the games in parallel, resolves the selection and fetches the source list.
   * @returns {Function} Effect callback, returning its cleanup.
   */
  buildEffect() {
    return () => {
      this.mounted = true;

      AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
        if (!this.mounted) return;

        if (!isStaffOrSuperUser) {
          this.redirectTo('/');
          return;
        }

        this.#load();
      });

      return () => {
        this.mounted = false;
      };
    };
  }

  /**
   * Fetch the source rows of the active type.
   *
   * @description Sends `from`/`to` plus the hash pagination params as the query; the copy type
   *   travels in the path.
   * @returns {Promise<void>} Resolves when the list has been stored (or the error recorded).
   */
  fetchList() {
    const { type, from, to } = this.selection;
    const pagination = Object.fromEntries(new HashRouteResolver().getPaginationParams());

    return RequestStore.ensure({
      componentName: COMPONENT_NAME,
      resource: RESOURCE,
      quantityType: 'collection',
      params: { copyType: type },
      query: { from, to, ...pagination },
    })
      .then(({ data, pagination: page }) => {
        this.safeSet(this.setRows, Array.isArray(data) ? data : []);
        this.safeSet(this.setPagination, page);
      })
      .catch(() => this.safeSet(this.setListError, LOAD_ERROR_KEY))
      .finally(() => this.safeSet(this.setLoading, false));
  }

  /**
   * Change one selector, rewriting the hash.
   *
   * @description Keeps the other selectors and drops pagination; the hash change remounts the
   *   page, which reloads with the new selection.
   * @param {string} key - `'type'`, `'from'` or `'to'`.
   * @param {string} value - The new value (`''` to clear).
   * @returns {void}
   */
  changeSelection(key, value) {
    this.redirectTo(StaffCopyUrl.build({ ...this.selection, [key]: value }));
  }

  #load() {
    const ensure = (quantityType) => RequestStore.ensure({
      componentName: COMPONENT_NAME, resource: RESOURCE, quantityType,
    });

    return Promise.all([ensure('index'), ensure('games')])
      .then(([index, games]) => this.#apply(index.data ?? {}, games.data))
      .catch(() => {
        this.safeSet(this.setError, LOAD_ERROR_KEY);
        this.safeSet(this.setLoading, false);
      });
  }

  #apply({ types = [] }, gamesData) {
    const games = Array.isArray(gamesData) ? gamesData : [];

    this.selection = StaffCopiesController.resolveSelection(types, games, StaffCopyUrl.read());
    this.safeSet(this.setTypes, types);
    this.safeSet(this.setGames, games);
    this.safeSet(this.setSelection, this.selection);

    if (!this.#validate()) {
      this.safeSet(this.setLoading, false);
      return null;
    }

    return this.fetchList();
  }

  #validate() {
    const { type, from, to } = this.selection;

    if (!type || !from || !to) return false;
    if (from !== to) return true;

    this.safeSet(this.setListError, SAME_GAME_ERROR_KEY);
    return false;
  }

  /**
   * Resolve the selection requested in the URL against the loaded types and games.
   *
   * @description A type not in `types` falls back to the first type (`''` when there are
   *   none); a game slug not in `games` is dropped (`''`).
   * @param {string[]} types - Available copy type slugs.
   * @param {{slug: string}[]} games - Available games.
   * @param {{type: string, from: string, to: string}} requested - Selection read from the URL.
   * @returns {{type: string, from: string, to: string}} The resolved selection.
   */
  static resolveSelection(types, games, { type, from, to }) {
    const slugs = games.map((game) => game.slug);
    const known = (slug) => (slugs.includes(slug) ? slug : '');

    return {
      type: types.includes(type) ? type : (types[0] ?? ''),
      from: known(from),
      to: known(to),
    };
  }
}
