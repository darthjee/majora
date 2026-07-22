import gameShowType from './configs/gameShowType.js';
import itemShowType from './configs/itemShowType.js';
import pcShowType from './configs/pcShowType.js';
import npcShowType from './configs/npcShowType.js';
import treasureShowType from './configs/treasureShowType.js';

/**
 * Per-show-type configuration consumed by `ShowPageLayout`, keyed by show type (`'game'`,
 * `'item'`, `'pc'`, `'npc'`, `'treasure'`, and further resource types as they're migrated onto
 * the shared show/new/edit layout). Each entry holds:
 * - `left`, `right`, `bottom` — arrays of slot entries. A plain entry (a component) renders the
 *   same in every mode; a mode-variant entry (`{Show, New, Edit}`) picks the component matching
 *   the current mode, rendering nothing for a mode it doesn't declare. Every rendered component
 *   receives the page's full rendering context (plus `mode`) spread as props.
 *
 * `item` is shared by `game-item`, `pc-item`, and `npc-item` alike (see `itemShowType.js`'s own
 * doc comment) rather than being split into three near-identical entries. `pc` and `npc` share
 * their show-mode slots verbatim (the show page was already identical for both character kinds
 * before this migration), but keep separate entries since their new/edit-mode fields/gating
 * genuinely differ (see `pcShowType.js`/`npcShowType.js`'s own doc comments).
 *
 * Split into one file per resource type under `./configs/`, the same way `listTypeConfig`
 * splits its own per-type entries, to keep this file small.
 *
 * `treasure` has no `Show` variant in any of its slots — it only backs the game-scoped
 * `new`/`edit` forms (see `treasureShowType.js`'s own doc comment for why the global treasure
 * detail/new/edit pages aren't included here).
 */
const showTypeConfig = {
  game: gameShowType,
  item: itemShowType,
  pc: pcShowType,
  npc: npcShowType,
  treasure: treasureShowType,
};

export default showTypeConfig;
