import RequestStore from '../../../../../utils/requests/RequestStore.js';

const COMPONENT_NAME = 'StaffCopiesController';
const RESOURCE = 'staffCopy';
const IN_FLIGHT_KEY = 'staff_copies_page.link_error.in_flight';
const UNKNOWN_KEY = 'staff_copies_page.link_error.unknown';

/**
 * Pending / failed links list of the staff copy page (issue #1571).
 *
 * @description Lists the pending and failed links of the target game (not paginated) and
 *   retries one link at a time per row: renews its token, then links it with the new token.
 *   A linked row, or one whose renew / link answers `404` (copied row or game gone), is
 *   dropped; a renew `409` shows the "in flight" error; a link failure refetches the list so the
 *   backend error shows. Owned by `StaffCopiesController`, sharing its mount state.
 */
export default class StaffCopyLinksController {
  /**
   * Create a links controller.
   *
   * @param {object} setters - React state setters.
   * @param {Function} setters.setLinks - Links list setter (`null` until loaded).
   * @param {Function} setters.setRetrying - Upload ids being retried setter.
   * @param {Function} setters.setLinkErrors - Upload id to local error (i18n key) map setter.
   * @param {object} deps - Dependencies.
   * @param {import('./StaffCopyActions.js').default} deps.actions - Renew / link actions.
   * @param {Function} deps.safeSet - Mount-aware setter runner (`(setter, value) => void`).
   */
  constructor({ setLinks, setRetrying, setLinkErrors }, { actions, safeSet }) {
    Object.assign(this, { setLinks, setRetrying, setLinkErrors });
    this.actions = actions;
    this.safeSet = safeSet;
    this.target = '';
    this.links = [];
    this.retrying = [];
    this.errors = {};
  }

  /**
   * Fetch the pending / failed links of a target game.
   *
   * @param {string} [target] - Target game slug (defaults to the last fetched one).
   * @returns {Promise<void>} Resolves once the list is stored (an error stores an empty list).
   */
  fetch(target = this.target) {
    this.target = target;

    return RequestStore.ensure({
      componentName: COMPONENT_NAME, resource: RESOURCE, quantityType: 'links', query: { to: target },
    })
      .then(({ data }) => this.#store(Array.isArray(data) ? data : []))
      .catch(() => this.#store([]));
  }

  /**
   * Purge the cached copy lists and refetch the links of the current target.
   *
   * @returns {Promise<void>} Resolves once the list is refetched.
   */
  refresh() {
    RequestStore.purge({ resource: RESOURCE });

    return this.fetch();
  }

  /**
   * Retry a pending / failed link.
   *
   * @param {{upload_id: number, upload_type: string}} link - The link row.
   * @returns {Promise<void>} Resolves once the retry finished.
   */
  async retry(link) {
    const id = link.upload_id;

    if (this.retrying.includes(id)) return;

    this.#setRetrying([...this.retrying, id]);
    this.#setError(id, null);

    await this.#runRetry(link);

    this.#setRetrying(this.retrying.filter((retrying) => retrying !== id));
  }

  async #runRetry(link) {
    const renew = await this.actions.renew(link.upload_id);

    if (!renew.ok) return this.#onRenewFailure(link, renew.status);

    const { ok, status } = await this.actions.link({
      upload_id: link.upload_id,
      upload_type: renew.data?.upload_type ?? link.upload_type,
      token: renew.data?.token,
    });

    if (ok || status === 404) return this.#drop(link);

    return this.refresh();
  }

  #onRenewFailure(link, status) {
    if (status === 404) return this.#drop(link);

    return this.#setError(link.upload_id, status === 409 ? IN_FLIGHT_KEY : UNKNOWN_KEY);
  }

  #drop(link) {
    this.#store(this.links.filter((row) => row.upload_id !== link.upload_id));
  }

  #store(links) {
    this.links = links;
    this.safeSet(this.setLinks, links);
  }

  #setRetrying(retrying) {
    this.retrying = retrying;
    this.safeSet(this.setRetrying, retrying);
  }

  #setError(id, key) {
    this.errors = { ...this.errors, [id]: key };
    this.safeSet(this.setLinkErrors, this.errors);
  }
}
