/**
 * @description Builds a fresh gameClient spy shared by every GameController spec file.
 * @returns {object} a gameClient spy with a default successful fetchGameAccess.
 */
export function buildGameClient() {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);
  gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ can_edit: false }),
  }));
  return gameClient;
}
