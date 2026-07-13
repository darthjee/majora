/**
 * @description Builds fresh spies shared by every GameNewController spec file.
 * @returns {object} the setters and client spy used to construct the controller.
 */
export function buildContext() {
  return {
    setError: jasmine.createSpy('setError'),
    setFieldErrors: jasmine.createSpy('setFieldErrors'),
    setStatus: jasmine.createSpy('setStatus'),
    gameClient: jasmine.createSpyObj('gameClient', ['createGame']),
  };
}
