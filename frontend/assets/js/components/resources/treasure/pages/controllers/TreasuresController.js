import GenericClient from '../../../../../client/GenericClient.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for treasures index page.
 */
export default class TreasuresController extends BasePageController {
  /**
   * Create a treasures controller.
   *
   * @param {Function} setTreasures - Treasures setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [setIsSuperUser] - Superuser/staff flag setter, for consistency/testability
   *   with GameTreasuresController — this page is only ever reached by staff/superusers, since
   *   any other user is redirected away below.
   */
  constructor(
    setTreasures,
    setPagination,
    setLoading,
    setError,
    client = null,
    setIsSuperUser = Noop.noop,
  ) {
    super();
    this.setTreasures = setTreasures;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.setIsSuperUser = setIsSuperUser;
  }

  /**
   * Build page loading effect.
   *
   * @description Redirects users who are neither staff nor superusers to the
   *   home page before fetching the treasures index.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
        if (!mounted) {
          return;
        }

        if (!isStaffOrSuperUser) {
          if (typeof window !== 'undefined') {
            window.location.hash = '/';
          }
          return;
        }

        safeSet(this.setIsSuperUser, true);

        this.client.fetchIndex('/treasures.json')
          .then(({ data, pagination }) => {
            safeSet(this.setTreasures, Array.isArray(data) ? data : []);
            safeSet(this.setPagination, pagination);
          })
          .catch(() => safeSet(this.setError, 'Unable to load treasures.'))
          .finally(() => safeSet(this.setLoading, false));
      });

      return () => {
        mounted = false;
      };
    };
  }
}
