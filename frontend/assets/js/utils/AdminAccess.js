import AuthClient from '../client/AuthClient.js';
import AuthStorage from './AuthStorage.js';

/**
 * Client-side admin (superuser) access check, shared by every admin-only
 * guarded page controller.
 */
export default class AdminAccess {
  /**
   * Resolves whether the currently stored auth token belongs to a superuser.
   *
   * @param {AuthClient} [client] - Auth client override, used for testing.
   * @returns {Promise<boolean>} Resolves to true when the user is a superuser.
   */
  static async isSuperUser(client = new AuthClient()) {
    try {
      const response = await client.status(AuthStorage.getToken());

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Boolean(data.is_superuser);
    } catch {
      return false;
    }
  }

  /**
   * Resolves whether the currently stored auth token belongs to a staff
   * member or a superuser.
   *
   * @param {AuthClient} [client] - Auth client override, used for testing.
   * @returns {Promise<boolean>} Resolves to true when the user is staff or a superuser.
   */
  static async isStaffOrSuperUser(client = new AuthClient()) {
    try {
      const response = await client.status(AuthStorage.getToken());

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Boolean(data.is_superuser) || Boolean(data.is_staff);
    } catch {
      return false;
    }
  }
}
