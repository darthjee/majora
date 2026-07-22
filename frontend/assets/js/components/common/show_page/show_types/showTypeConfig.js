import gameShowType from './configs/gameShowType.js';
import itemShowType from './configs/itemShowType.js';

/**
 * Per-show-type configuration consumed by `ShowPageLayout`, keyed by show type (`'game'`,
 * `'item'`, and further resource types as they're migrated onto the shared show/new/edit
 * layout). Each entry holds:
 * - `left`, `right`, `bottom` — arrays of slot entries. A plain entry (a component) renders the
 *   same in every mode; a mode-variant entry (`{Show, New, Edit}`) picks the component matching
 *   the current mode, rendering nothing for a mode it doesn't declare. Every rendered component
 *   receives the page's full rendering context (plus `mode`) spread as props.
 *
 * `item` is shared by `game-item`, `pc-item`, and `npc-item` alike (see `itemShowType.js`'s own
 * doc comment) rather than being split into three near-identical entries.
 *
 * Split into one file per resource type under `./configs/`, the same way `listTypeConfig`
 * splits its own per-type entries, to keep this file small.
 */
const showTypeConfig = {
  game: gameShowType,
  item: itemShowType,
};

export default showTypeConfig;
