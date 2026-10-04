import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Access controller shared by every access statistics tab page.
 */
export default class StaffStatisticsPageController extends BasePageController {
  /**
   * Creates a statistics page controller.
   *
   * @param {Function} setAllowed - Setter flagging that the user may see the page.
   */
  constructor(setAllowed) {
    super();
    this.setAllowed = setAllowed;
  }

  /**
   * Builds the page access effect.
   *
   * @description Redirects non-staff / non-superusers to the home page, otherwise flags the
   *   page as allowed. On top of the route gates, like `StaffUsersController.js`.
   * @returns {Function} Effect callback returning its cleanup.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);

      AccessStore.ensureStaffOrSuperUser()
        .then((isStaffOrSuperUser) => {
          if (!mounted) return;

          if (isStaffOrSuperUser) {
            safeSet(this.setAllowed, true);
          } else {
            this.redirectTo('/');
          }
        })
        .catch(() => {
          if (mounted) this.redirectTo('/');
        });

      return () => {
        mounted = false;
      };
    };
  }
}
