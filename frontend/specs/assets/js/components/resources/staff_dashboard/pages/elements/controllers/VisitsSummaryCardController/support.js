import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

/**
 * @description Builds fresh spies shared by every VisitsSummaryCardController spec file.
 * @returns {object} the setters and timezone resolver used to construct the controller.
 */
export function buildContext() {
  return {
    setSummary: jasmine.createSpy('setSummary'),
    setStatus: jasmine.createSpy('setStatus'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    timezone: jasmine.createSpy('timezone').and.returnValue('America/Sao_Paulo'),
  };
}

/**
 * @description Stubs `RequestStore.ensure` to resolve the given unique-visitors count.
 * @param {number} uniqueVisitors - the count the summary endpoint returns.
 * @returns {jasmine.Spy} the installed spy.
 */
export function stubEnsure(uniqueVisitors = 5) {
  return spyOn(RequestStore, 'ensure').and.returnValue(
    Promise.resolve({ data: { period: 'day', unique_visitors: uniqueVisitors } }),
  );
}

/**
 * @description Returns the `query` of the most recent `RequestStore.ensure` call.
 * @returns {object} the query.
 */
export function lastQuery() {
  return RequestStore.ensure.calls.mostRecent().args[0].query;
}
