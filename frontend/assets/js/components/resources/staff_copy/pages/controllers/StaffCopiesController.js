import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import StaffCopyUrl from '../helpers/StaffCopyUrl.js';
import StaffCopyActions from './StaffCopyActions.js';
import StaffCopyRunner from './StaffCopyRunner.js';
import StaffCopyLinksController from './StaffCopyLinksController.js';

const COMPONENT_NAME = 'StaffCopiesController';
const RESOURCE = 'staffCopy';
const LOAD_ERROR_KEY = 'staff_copies_page.error';
const SAME_GAME_ERROR_KEY = 'staff_copies_page.same_game_error';

/**
 * Controller for the staff copy page (issue #1571).
 *
 * @description Gates the page to staff/superusers, loads the copy types and the games in
 *   parallel, resolves the `type`/`from`/`to` selection from the hash query (a stale type falls
 *   back to the first one, unknown games are dropped), lists the copyable rows of the active
 *   type once both games are selected and differ, and runs the sequential copy of the selected
 *   rows (guarding the page against unloading meanwhile). The pending / failed links of the
 *   target game are handled by `this.links` (a `StaffCopyLinksController`). Every state update goes through a safe setter
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
   * @param {Function} setters.setRun - Copy run snapshot setter (see `StaffCopyRunner`).
   * @param {Function} setters.setLinks - Pending / failed links list setter.
   * @param {Function} setters.setRetrying - Upload ids being retried setter.
   * @param {Function} setters.setLinkErrors - Upload id to local link error map setter.
   * @param {object} [deps] - Injectable dependencies.
   * @param {StaffCopyActions} [deps.actions] - Outcome-returning copy / link actions.
   * @param {object} [deps.win] - `beforeunload` listener target (defaults to `window`).
   */
  constructor(setters, { actions = new StaffCopyActions(), win = globalThis.window } = {}) {
    super();
    Object.assign(this, setters);
    this.actions = actions;
    this.win = win;
    this.selection = { type: '', from: '', to: '' };
    this.mounted = false;
    this.safeSet = this.buildSafeSetter(() => this.mounted);
    this.links = new StaffCopyLinksController(setters, { actions, safeSet: this.safeSet });
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
        this.#guardUnload(false);
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

  /**
   * Copy the given rows into the target game, one at a time.
   *
   * @description Publishes progress through `setRun`, guards the page against unloading while
   *   running (leaving mid-run leaves the remaining links pending) and, once done, purges the
   *   cached copy lists and refreshes the source list and the pending links list.
   * @param {object[]} rows - The selected source rows.
   * @returns {Promise<void>} Resolves once every row is processed and the list refreshed.
   */
  async runCopy(rows) {
    const { type, to } = this.selection;
    const runner = new StaffCopyRunner(this.actions, (run) => this.safeSet(this.setRun, run));

    this.#guardUnload(true);
    await runner.run(type, to, rows);
    this.#guardUnload(false);
    RequestStore.purge({ resource: RESOURCE });

    return Promise.all([this.fetchList(), this.links.fetch(to)]).then(() => undefined);
  }

  #onBeforeUnload = (event) => {
    event.preventDefault();
    event.returnValue = '';
  };

  #guardUnload(active) {
    const method = active ? 'addEventListener' : 'removeEventListener';

    this.win?.[method]?.('beforeunload', this.#onBeforeUnload);
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
    if (this.selection.to) this.links.fetch(this.selection.to);

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
