import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

/**
 * @description Builds fresh spies shared by every StaffDashboardController spec file.
 * @returns {object} the setters and client spies used to construct the controller.
 */
export function buildContext() {
  return {
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    setStatus: jasmine.createSpy('setStatus'),
    client: jasmine.createSpyObj('client', ['clearCache']),
  };
}

/**
 * @description Stubs `AccessStore#ensureStaffOrSuperUser` with a default resolved value,
 *   shared by every StaffDashboardController spec file. Must be called from a `beforeEach`/`it` body.
 * @param {boolean} [isStaffOrSuperUser] - Whether the stubbed access grants staff/superuser permission.
 * @returns {void}
 */
export function stubAccessStore(isStaffOrSuperUser = true) {
  spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(isStaffOrSuperUser));
}
