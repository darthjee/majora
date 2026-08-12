import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

/**
 * @description Builds fresh spies shared by every FactionNewController spec file.
 * @returns {object} the setters spies used to construct the controller.
 */
export function buildContext() {
  return {
    setError: jasmine.createSpy('setError'),
    setFieldErrors: jasmine.createSpy('setFieldErrors'),
    setStatus: jasmine.createSpy('setStatus'),
    setCreatedId: jasmine.createSpy('setCreatedId'),
    onSuccess: jasmine.createSpy('onSuccess'),
  };
}

/**
 * @description Stubs `AccessStore#ensureGamePermissions` with a default resolved
 *   `can_create_faction` value, shared by every FactionNewController spec file. Must be called
 *   from a `beforeEach`/`it` body.
 * @param {boolean} [canCreateFaction] - Whether the stubbed permissions grant `can_create_faction`.
 * @returns {void}
 */
export function stubAccessStore(canCreateFaction = true) {
  spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(
    Promise.resolve({ can_create_faction: canCreateFaction }),
  );
}
