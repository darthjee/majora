/**
 * Shared AccessStore stubbing helper for Jasmine page-controller specs.
 * Mimics the real `AccessCache` semantics that page controllers now rely on
 * (see `frontend/assets/js/utils/AccessCache.js`): a synchronous `get*`
 * reader that returns a fail-closed default until the paired `ensure*`
 * fetch resolves, after which it returns the resolved value.
 */
import AccessStore from '../../assets/js/utils/AccessStore.js';

/**
 * Stub a matched `ensure*`/`get*` pair on {@link AccessStore} so the `get*`
 * reader returns `defaultValue` until the `ensure*` promise settles, then
 * returns `resolvedValue` — letting specs assert the two-phase (deny-all,
 * then real-value) render behavior page controllers implement.
 *
 * @param {string} ensureMethod - Name of the `AccessStore.ensure*` static method to stub.
 * @param {string} getMethod - Name of the `AccessStore.get*` static method to stub.
 * @param {*} resolvedValue - Value the pair resolves to once `ensure*` settles.
 * @param {*} defaultValue - Value `get*` returns before `ensure*` settles.
 * @returns {{ensureSpy: jasmine.Spy, getSpy: jasmine.Spy}} The installed spies.
 */
export function stubAccessPair(ensureMethod, getMethod, resolvedValue, defaultValue) {
  let resolved = false;

  const getSpy = spyOn(AccessStore, getMethod)
    .and.callFake(() => (resolved ? resolvedValue : defaultValue));
  const ensureSpy = spyOn(AccessStore, ensureMethod)
    .and.callFake(() => Promise.resolve(resolvedValue).then((value) => {
      resolved = true;
      return value;
    }));

  return { ensureSpy, getSpy };
}
