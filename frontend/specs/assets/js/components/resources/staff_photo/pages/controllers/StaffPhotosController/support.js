import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import StaffPhotosController from '../../../../../../../../../assets/js/components/resources/staff_photo/pages/controllers/StaffPhotosController.js';

/**
 * @description Builds fresh setter spies shared by every StaffPhotosController spec file.
 * @returns {object} the setters used to construct the controller.
 */
export function buildSetters() {
  return {
    setTypes: jasmine.createSpy('setTypes'),
    setMaxDimension: jasmine.createSpy('setMaxDimension'),
    setPhotoType: jasmine.createSpy('setPhotoType'),
    setPhotos: jasmine.createSpy('setPhotos'),
    setPagination: jasmine.createSpy('setPagination'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    setActionError: jasmine.createSpy('setActionError'),
    setVersions: jasmine.createSpy('setVersions'),
  };
}

/**
 * @description Builds a mounted controller already pointing at the given photo type.
 * @param {object} setters - Setter spies.
 * @param {string} [photoType] - Active photo type.
 * @returns {StaffPhotosController} the controller.
 */
export function buildMountedController(setters, photoType = 'game_item') {
  const controller = new StaffPhotosController(setters);

  controller.mounted = true;
  controller.photoType = photoType;

  return controller;
}

/**
 * @description Stubs `AccessStore#ensureStaffOrSuperUser` with a resolved value.
 * @param {boolean} [isStaffOrSuperUser] - Whether staff/superuser access is granted.
 * @returns {void}
 */
export function stubAccessStore(isStaffOrSuperUser = true) {
  spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(isStaffOrSuperUser));
}

/**
 * @description Lets every pending promise callback run.
 * @returns {Promise<void>} resolves on the next macrotask.
 */
export function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export const PAGINATION = {
  page: 1, pages: 2, perPage: 10, total: 11,
};
