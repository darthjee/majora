import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';

/**
 * @description Builds a fresh gameClient spy shared by every GamePhotosController spec file.
 * @returns {object} a gameClient spy with a default successful fetchGame.
 */
export function buildGameClient() {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
  gameClient.fetchGame.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ name: 'Demo', game_slug: 'demo' }),
  }));
  return gameClient;
}

/**
 * @description Stubs `AccessStore#ensureGameAccess` with a default resolved value, shared by
 *   every GamePhotosController spec file. Must be called from a `beforeEach`/`it` body.
 * @param {boolean} [canEdit] - Whether the stubbed access grants edit permission.
 * @returns {void}
 */
export function stubAccessStore(canEdit = false) {
  spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ can_edit: canEdit }));
}
