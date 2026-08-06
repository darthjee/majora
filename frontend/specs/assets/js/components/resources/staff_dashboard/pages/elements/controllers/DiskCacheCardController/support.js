/**
 * @description Builds fresh spies shared by every DiskCacheCardController spec file.
 * @returns {object} the setters and client spy used to construct the controller.
 */
export function buildContext() {
  return {
    setSize: jasmine.createSpy('setSize'),
    setStatus: jasmine.createSpy('setStatus'),
    setLoading: jasmine.createSpy('setLoading'),
    setError: jasmine.createSpy('setError'),
    client: jasmine.createSpyObj('client', ['fetchDiskCacheSize', 'clearDiskCache']),
  };
}
