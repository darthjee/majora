import gameConfig from './config/gameConfig.js';
import npcConfig from './config/npcConfig.js';
import pcConfig from './config/pcConfig.js';
import itemConfig from './config/itemConfig.js';
import treasureConfig from './config/treasureConfig.js';
import sessionConfig from './config/sessionConfig.js';
import documentConfig from './config/documentConfig.js';
import pollConfig from './config/pollConfig.js';
import taskConfig from './config/taskConfig.js';
import staffUserConfig from './config/staffUserConfig.js';

const RESOURCES = {
  game: gameConfig,
  npc: npcConfig,
  pc: pcConfig,
  item: itemConfig,
  treasure: treasureConfig,
  session: sessionConfig,
  document: documentConfig,
  poll: pollConfig,
  task: taskConfig,
  staffUser: staffUserConfig,
};

/**
 * Assembles every per-resource GET/mutation config (`./config/*.js`) into one keyed lookup,
 * mirroring how `accessRouteConfig.js` centralizes per-page descriptors today.
 *
 * @description Each per-resource file is keyed by HTTP method first (`GET`, plus whichever of
 *   `POST`/`PATCH`/`PUT` that resource's mutations use). Each method's value is keyed by quantity
 *   type (`collection`/`single`, plus any resource-specific key such as `session`'s `message`/
 *   `pollProposal` or `poll`'s `votes`/`close`), each holding a `{ regular, private }` pair of
 *   `{ path, permission }` entries — `path` is a function of the concrete params returning the
 *   endpoint path, `permission` is either `null` (open to everyone), a permission-key string
 *   (e.g. `'can_edit'`) looked up on the caller-supplied permissions object, or a function of
 *   params returning either of those (for the rare case where whether a restricted endpoint even
 *   exists depends on a param — see `treasureConfig.js`). A variant may also carry a
 *   `skipCache: true` flag (see `pollConfig.js`'s `GET.single`), forwarded as `X-Skip-Cache: true`
 *   by `RequestClient#fetchResource`'s `GET` dispatch.
 */
export default {
  /**
   * Look up the resolved `{ regular, private }` config entry for a resource.
   *
   * @param {string} method - HTTP method (e.g. `'GET'`, `'POST'`, `'PATCH'`, `'PUT'`).
   * @param {string} resource - Resource name (`'game'`, `'npc'`, `'pc'`, `'item'`, `'treasure'`,
   *   `'session'`, `'document'`, `'poll'`, `'task'`, `'staffUser'`).
   * @param {string} quantityType - `'collection'`, `'single'`, or a resource-specific key.
   * @returns {{regular: object, private: object}|null} The config entry, or `null` when no
   *   configuration exists for the given method/resource/quantity-type combination.
   */
  get(method, resource, quantityType) {
    return RESOURCES[resource]?.[method]?.[quantityType] ?? null;
  },
};
