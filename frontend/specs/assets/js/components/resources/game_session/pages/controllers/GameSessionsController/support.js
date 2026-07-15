import { DEFAULT_SESSION_PAGINATION } from
  '../../../../../../../../../assets/js/components/resources/game_session/pages/sessionColumns.js';

/**
 * @description Builds a `GenericClient` spy whose `fetchIndex` resolves with an empty session
 *   list and default pagination for the past/future/unscheduled endpoints, unless a fake
 *   implementation is provided.
 * @param {string} hash - Hash value returned by `currentHash`.
 * @param {Function} [fetchIndexImpl] - Optional override for `fetchIndex`'s implementation.
 * @returns {jasmine.SpyObj} the client spy.
 */
export function buildClient(hash, fetchIndexImpl = null) {
  const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);
  client.currentHash.and.returnValue(hash);

  if (fetchIndexImpl) {
    client.fetchIndex.and.callFake(fetchIndexImpl);
  } else {
    client.fetchIndex.and.returnValue(
      Promise.resolve({ data: [], pagination: { ...DEFAULT_SESSION_PAGINATION } }),
    );
  }

  return client;
}

/**
 * @description Reduces every `setColumns` functional-update call recorded on the spy over the
 *   given initial state, mirroring how React applies queued updater functions.
 * @param {jasmine.Spy} setColumnsSpy - The `setColumns` spy passed to the controller.
 * @param {object} initialColumns - Initial 3-column state to fold updates onto.
 * @returns {object} the resulting 3-column state.
 */
export function applyColumnUpdates(setColumnsSpy, initialColumns) {
  return setColumnsSpy.calls.allArgs().reduce((columns, [updater]) => (
    typeof updater === 'function' ? updater(columns) : updater
  ), initialColumns);
}
