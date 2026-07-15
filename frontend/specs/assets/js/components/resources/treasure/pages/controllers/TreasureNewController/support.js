import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

/**
 * @description Builds fresh spies shared by every TreasureNewController spec file.
 * @returns {object} the setters and client spies used to construct the controller.
 */
export function buildContext() {
  return {
    setError: jasmine.createSpy('setError'),
    setFieldErrors: jasmine.createSpy('setFieldErrors'),
    setStatus: jasmine.createSpy('setStatus'),
    treasureClient: jasmine.createSpyObj('treasureClient', ['createTreasure']),
  };
}

/**
 * @description Stubs `AccessStore#ensureStaffOrSuperUser` with a default resolved value,
 *   shared by every TreasureNewController spec file. Must be called from a `beforeEach`/`it` body.
 * @param {boolean} [isStaffOrSuperUser] - Whether the stubbed access grants staff/superuser permission.
 * @returns {void}
 */
export function stubAccessStore(isStaffOrSuperUser = true) {
  spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(isStaffOrSuperUser));
}
