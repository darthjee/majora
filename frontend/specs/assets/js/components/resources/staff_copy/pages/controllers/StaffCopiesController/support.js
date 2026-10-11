import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import StaffCopiesController from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/controllers/StaffCopiesController.js';

/**
 * @description Builds fresh setter spies shared by every StaffCopiesController spec file.
 * @returns {object} the setters used to construct the controller.
 */
export function buildSetters() {
  return {
    setTypes: jasmine.createSpy('setTypes'),
    setGames: jasmine.createSpy('setGames'),
    setSelection: jasmine.createSpy('setSelection'),
    setRows: jasmine.createSpy('setRows'),
    setPagination: jasmine.createSpy('setPagination'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    setListError: jasmine.createSpy('setListError'),
  };
}

/**
 * @description Builds a mounted controller already pointing at the given selection.
 * @param {object} setters - Setter spies.
 * @param {object} [selection] - Active `{type, from, to}` selection.
 * @param {object} [deps] - Controller dependencies.
 * @returns {StaffCopiesController} the controller.
 */
export function buildMountedController(setters, selection = SELECTION, deps = {}) {
  const controller = new StaffCopiesController(setters, deps);

  controller.mounted = true;
  controller.selection = { ...selection };

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

export const SELECTION = { type: 'items', from: 'source-game', to: 'target-game' };

export const GAMES = [
  { slug: 'source-game', name: 'Source', domain_groups: [] },
  { slug: 'target-game', name: 'Target', domain_groups: [] },
];

export const PAGINATION = {
  page: 1, pages: 2, perPage: 10, total: 11,
};
