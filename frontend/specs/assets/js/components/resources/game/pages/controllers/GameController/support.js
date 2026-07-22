import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';

/**
 * @description Stubs `AccessStore.ensureGameAccess`/`getGameAccess` with a
 *   default fail-closed resolution, shared by every GameController spec file.
 * @param {object} [resolvedValue] - Value the pair resolves to once `ensureGameAccess` settles.
 * @param {object} [defaultValue] - Value `getGameAccess` returns before it settles.
 * @returns {jasmine.Spy} the installed `ensureGameAccess` spy.
 */
export function stubEnsureGameAccess(resolvedValue = {}, defaultValue = {}) {
  return stubAccessPair('ensureGameAccess', 'getGameAccess', resolvedValue, defaultValue).ensureSpy;
}

/**
 * @description Stubs `RequestStore.ensure` with the game data `#fetchGame` resolves through,
 *   shared by every GameController spec file exercising the base game fetch.
 * @param {object} [gameData] - Value `RequestStore.ensure` resolves `{ data }` to.
 * @returns {jasmine.Spy} the installed `RequestStore.ensure` spy.
 */
export function stubEnsureGame(gameData = { game_slug: 'demo' }) {
  return spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: gameData }));
}

/**
 * @description Stubs `AccessStore.ensureGamePermissions`/`getGamePermissions` with a
 *   default fail-closed resolution, shared by every GameController spec file.
 * @param {{can_edit: boolean}} [resolvedValue] - Value the pair resolves to once
 *   `ensureGamePermissions` settles.
 * @param {{can_edit: boolean}} [defaultValue] - Value `getGamePermissions` returns before it settles.
 * @returns {jasmine.Spy} the installed `ensureGamePermissions` spy.
 */
export function stubEnsureGamePermissions(resolvedValue = { can_edit: false }, defaultValue = { can_edit: false }) {
  return stubAccessPair('ensureGamePermissions', 'getGamePermissions', resolvedValue, defaultValue).ensureSpy;
}
