/**
 * @description Builds a fresh gameClient spy shared by every GamePhotosController spec file.
 * @returns {object} a gameClient spy with default successful fetchGame/fetchGameAccess.
 */
export function buildGameClient() {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame', 'fetchGameAccess']);
  gameClient.fetchGame.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
  }));
  gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ can_edit: false }),
  }));
  return gameClient;
}
