import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { buildGame } from '../../../../../../../../support/factories.js';

/**
 * @description Builds a fresh gameClient spy shared by every GamePhotosController spec file.
 * @returns {object} a gameClient spy with a default successful fetchGame.
 */
export function buildGameClient() {
  const gameClient = jasmine.createSpyObj('gameClient', ['fetchGame']);
  gameClient.fetchGame.and.returnValue(Promise.resolve({
    ok: true,
    json: () => Promise.resolve(buildGame({ name: 'Demo', game_slug: 'demo' })),
  }));
  return gameClient;
}

/**
 * @description Stubs `AccessStore#ensureGameAccess` with a default resolved value, shared by
 *   every GamePhotosController spec file. Must be called from a `beforeEach`/`it` body.
 * @param {boolean} [canUploadPhoto] - Whether the stubbed access grants photo-upload permission
 *   (translated internally into `is_player: true`/`false`, one of the several flags
 *   `#canUploadPhoto` accepts).
 * @returns {void}
 */
export function stubAccessStore(canUploadPhoto = false) {
  spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: canUploadPhoto }));
}
