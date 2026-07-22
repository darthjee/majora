import gameShowType from './configs/gameShowType.js';

/**
 * Per-show-type configuration consumed by `ShowPageLayout`, keyed by show type (`'game'`, and
 * further resource types as they're migrated onto the shared show/new/edit layout). Each entry
 * holds:
 * - `left`, `right`, `bottom` — arrays of slot entries. A plain entry (a component) renders the
 *   same in every mode; a mode-variant entry (`{Show, New, Edit}`) picks the component matching
 *   the current mode, rendering nothing for a mode it doesn't declare. Every rendered component
 *   receives the page's full rendering context (plus `mode`) spread as props.
 *
 * Split into one file per resource type under `./configs/`, the same way `listTypeConfig`
 * splits its own per-type entries, to keep this file small.
 */
const showTypeConfig = {
  game: gameShowType,
};

export default showTypeConfig;
