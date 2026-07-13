import AccessStore from '../../../../../../../../../assets/js/utils/AccessStore.js';

/**
 * @description Stubs `AccessStore.ensureGameAccess` with a default fail-closed
 *   resolution, shared by every GameController spec file.
 * @returns {jasmine.Spy} the installed spy, so specs can override its return value.
 */
export function stubEnsureGameAccess() {
  return spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
}

/**
 * @description Stubs `AccessStore.ensureGamePermissions` with a default fail-closed
 *   resolution, shared by every GameController spec file.
 * @returns {jasmine.Spy} the installed spy, so specs can override its return value.
 */
export function stubEnsureGamePermissions() {
  return spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
}
