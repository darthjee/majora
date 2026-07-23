/**
 * @description Builds fresh spies shared by every MemoryCacheCardController spec file.
 * @returns {object} the setters and client spy used to construct the controller.
 */
export function buildContext() {
  return {
    setSummary: jasmine.createSpy('setSummary'),
    setStatus: jasmine.createSpy('setStatus'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    client: jasmine.createSpyObj('client', ['fetchSummary', 'clearCache']),
  };
}
