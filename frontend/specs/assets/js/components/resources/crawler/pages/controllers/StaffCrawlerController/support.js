import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

/**
 * @description Builds fresh setter spies shared by every StaffCrawlerController spec file.
 * @returns {object} The setters used to construct the controller.
 */
export function buildContext() {
  return {
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    setEmissions: jasmine.createSpy('setEmissions'),
    setSelectedId: jasmine.createSpy('setSelectedId'),
  };
}

/**
 * @description Builds a fake `CrawlerClient` with a spied `fetchEmissions` method, shared by
 *   every StaffCrawlerController spec file.
 * @returns {{fetchEmissions: jasmine.Spy}} The fake client.
 */
export function buildClient() {
  return { fetchEmissions: jasmine.createSpy('fetchEmissions') };
}

/**
 * @description Stubs `AccessStore#ensureStaffOrSuperUser` with a default resolved value,
 *   shared by every StaffCrawlerController spec file. Must be called from a `beforeEach`/`it` body.
 * @param {boolean} [isStaffOrSuperUser] - Whether the stubbed access grants staff/superuser permission.
 * @returns {void}
 */
export function stubAccessStore(isStaffOrSuperUser = true) {
  spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(isStaffOrSuperUser));
}

/**
 * @description Builds a fake fetch `Response`-shaped object resolving to `body`, for stubbing
 *   `fetchEmissions` resolutions.
 * @param {Array} body - JSON array body the response resolves to.
 * @returns {{ok: boolean, json: Function}} The fake response.
 */
export function buildResponse(body) {
  return { ok: true, json: () => Promise.resolve(body) };
}

/**
 * @description Builds a page of fake emission records, oldest-first, each with a distinct `id`.
 * @param {number} count - Number of records to build.
 * @param {number} [startId] - `id` of the first built record.
 * @returns {object[]} The built emission records.
 */
export function buildEmissions(count, startId = 1) {
  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    created_at: '2026-01-01T00:00:00Z',
    source: 'lootstudios',
    type: 'candidate',
    payload: {},
  }));
}
