/**
 * @description Builds fresh spies shared by every TreasureNewController spec file.
 * @returns {object} the setters and client spies used to construct the controller.
 */
export function buildContext() {
  return {
    setError: jasmine.createSpy('setError'),
    setFieldErrors: jasmine.createSpy('setFieldErrors'),
    setStatus: jasmine.createSpy('setStatus'),
    treasureClient: jasmine.createSpyObj('treasureClient', ['createTreasure']),
    authClient: jasmine.createSpyObj('authClient', ['status']),
  };
}
