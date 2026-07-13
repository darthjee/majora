import AccessStore from '../../../../../../../../../assets/js/utils/AccessStore.js';

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
 * @description Stubs `AccessStore#ensureSuperUser` with a default resolved value, shared by
 *   every TreasureNewController spec file. Must be called from a `beforeEach`/`it` body.
 * @param {boolean} [isSuperUser] - Whether the stubbed access grants superuser permission.
 * @returns {void}
 */
export function stubAccessStore(isSuperUser = true) {
  spyOn(AccessStore, 'ensureSuperUser').and.returnValue(Promise.resolve(isSuperUser));
}
