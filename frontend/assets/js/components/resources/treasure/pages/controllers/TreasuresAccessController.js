import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the global Treasures index page's staff/superuser access gate, redirecting
 * away any non-staff, non-superuser viewer before the page renders anything else — the same
 * check `TreasuresController` previously ran inline before fetching the treasures list itself.
 * The list itself is now fetched through the shared `ListPage`/`listTypeConfig` abstraction
 * (`treasures-global`), which resolves the same staff-or-superuser check independently for its
 * own per-item action-bar gating, so this controller's only remaining responsibility is the
 * page-level redirect-away gate.
 */
export default class TreasuresAccessController {
  /**
   * Create a treasures access controller.
   *
   * @param {Function} [setAllowed] - Setter called with `true` once the current viewer is
   *   confirmed staff or a superuser; never called (and the viewer is redirected instead)
   *   otherwise.
   */
  constructor(setAllowed = Noop.noop) {
    this.setAllowed = setAllowed;
  }

  /**
   * Build the page mount effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;

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

        this.setAllowed(true);
      });

      return () => {
        mounted = false;
      };
    };
  }
}
