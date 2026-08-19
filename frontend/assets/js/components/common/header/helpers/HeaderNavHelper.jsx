import React from 'react';
import NavDropdown from 'react-bootstrap/cjs/NavDropdown.js';
import Translator from '../../../../i18n/Translator.js';
import CurrentPageContext from '../../../../utils/context/CurrentPageContext.js';
import RuleMatcher from '../../../../utils/rules/RuleMatcher.js';

const LOGGED_IN = { all: ['loggedIn'] };
const IS_ADMIN = { any: ['isSuperUser', 'isStaff'] };
const IS_GAME_PAGE = { all: ['isGamePage'] };
const HAS_GAME_ACCESS = { all: ['isGamePage', 'hasGameAccess'] };
const IS_PC_PAGE = { all: ['isPcPage'] };
const IS_NPC_PAGE = { all: ['isNpcPage'] };

/**
 * Ordered list of the header's nav dropdown groups (id, translated-title key, and
 * `NavDropdown` id), driving group *render order* (Miniatures, Admin, Game, PC, NPC) —
 * this cannot be inferred from {@link NAV_LINK_REGISTRY}'s flat, possibly-interleaved
 * entry order, so it is declared explicitly here instead.
 */
export const NAV_LINK_GROUPS = [
  { id: 'miniatures', titleKey: 'header.nav_miniatures', dropdownId: 'header-miniatures-nav-dropdown' },
  { id: 'admin', titleKey: 'header.nav_admin', dropdownId: 'header-admin-nav-dropdown' },
  { id: 'game', titleKey: 'header.nav_game', dropdownId: 'header-game-nav-dropdown' },
  { id: 'pc', titleKey: 'header.nav_pc', dropdownId: 'header-pc-nav-dropdown' },
  { id: 'npc', titleKey: 'header.nav_npc', dropdownId: 'header-npc-nav-dropdown' },
];

/**
 * Builds a "Miniatures" dropdown entry (STL Models/Sources/Collections), each gated by
 * a flat `loggedIn` check, mirroring the group's single-check dropdown shape.
 *
 * @param {string} id - Entry id suffix (unique within the `miniatures` group).
 * @param {string} path - URL segment under `#/miniatures/`.
 * @param {string} labelKey - i18n key for the item's label.
 * @returns {{id: string, group: string, rules: object, render: Function}} the registry entry.
 */
function miniaturesItem(id, path, labelKey) {
  return {
    id: `miniatures-${id}`,
    group: 'miniatures',
    rules: LOGGED_IN,
    render: () => (
      <NavDropdown.Item href={`#/miniatures/${path}`}>{Translator.t(labelKey)}</NavDropdown.Item>
    ),
  };
}

/**
 * Builds an "Admin" dropdown entry (Treasures/Staff Users/Staff Dashboard), each gated
 * by the same superuser-or-staff check.
 *
 * @param {string} id - Entry id suffix (unique within the `admin` group).
 * @param {string} path - URL segment under `#/`.
 * @param {string} labelKey - i18n key for the item's label.
 * @returns {{id: string, group: string, rules: object, render: Function}} the registry entry.
 */
function adminItem(id, path, labelKey) {
  return {
    id: `admin-${id}`,
    group: 'admin',
    rules: IS_ADMIN,
    render: () => (
      <NavDropdown.Item href={`#/${path}`}>{Translator.t(labelKey)}</NavDropdown.Item>
    ),
  };
}

/**
 * Builds a "Game" dropdown entry, scoped under the current route's `gameSlug`. Base
 * items (show/pcs/npcs/treasures/items/possessions/factions/documents/photos) default
 * to the group's `isGamePage`-only gate; the Players/Polls/Sessions items pass the
 * stricter `HAS_GAME_ACCESS` rule instead, restricting them to the game's DM(s),
 * players, and admins (superuser/staff) — the same audience rule used by
 * `OpenPollsWidget`/`GamePollsController`.
 *
 * @param {string} id - Entry id suffix (unique within the `game` group).
 * @param {string} path - URL segment appended after `#/games/:gameSlug` (empty for the "show" item).
 * @param {string} labelKey - i18n key for the item's label.
 * @param {object} [rules] - Rule set gating this item; defaults to `IS_GAME_PAGE`.
 * @returns {{id: string, group: string, rules: object, render: Function}} the registry entry.
 */
function gameItem(id, path, labelKey, rules = IS_GAME_PAGE) {
  return {
    id: `game-${id}`,
    group: 'game',
    rules,
    render: (context) => (
      <NavDropdown.Item href={`#/games/${context.route.gameSlug}${path}`}>{Translator.t(labelKey)}</NavDropdown.Item>
    ),
  };
}

/**
 * Builds a PC or NPC dropdown entry, scoped under the current route's `gameSlug`/
 * `characterId`. Item labels are shared between the PC and NPC dropdowns — only the
 * group's title/dropdown id (see {@link NAV_LINK_GROUPS}) and the URL segment
 * (`pcs`/`npcs`) differ.
 *
 * @param {'pc'|'npc'} kind - Which character dropdown this entry belongs to.
 * @param {string} id - Entry id suffix (unique within the `pc`/`npc` group).
 * @param {string} path - URL segment appended after the character's base path (empty for the "show" item).
 * @param {string} labelKey - i18n key for the item's label.
 * @returns {{id: string, group: string, rules: object, render: Function}} the registry entry.
 */
function characterItem(kind, id, path, labelKey) {
  const segment = kind === 'pc' ? 'pcs' : 'npcs';

  return {
    id: `${kind}-${id}`,
    group: kind,
    rules: kind === 'pc' ? IS_PC_PAGE : IS_NPC_PAGE,
    render: (context) => {
      const { gameSlug, characterId } = context.route;
      const base = `#/games/${gameSlug}/${segment}/${characterId}`;

      return <NavDropdown.Item href={`${base}${path}`}>{Translator.t(labelKey)}</NavDropdown.Item>;
    },
  };
}

/**
 * Builds the five PC/NPC dropdown entries (show/photos/treasures/items/documents)
 * shared by both character kinds.
 *
 * @param {'pc'|'npc'} kind - Which character dropdown to build entries for.
 * @returns {{id: string, group: string, rules: object, render: Function}[]} the character dropdown's entries.
 */
function characterItems(kind) {
  return [
    characterItem(kind, 'show', '', 'header.nav_game_show'),
    characterItem(kind, 'photos', '/photos', 'character_page.see_all_photos'),
    characterItem(kind, 'treasures', '/treasures', 'character_page.treasures_title'),
    characterItem(kind, 'items', '/items', 'character_page.items_title'),
    characterItem(kind, 'documents', '/documents', 'character_page.documents_title'),
  ];
}

/**
 * Flat, declarative registry of the header's nav-link dropdown entries (Miniatures,
 * Admin, Game, PC, NPC): each entry declares its own `group` (which dropdown it
 * belongs to), `rules` (evaluated by {@link RuleMatcher}), and `render(context)`.
 * Dropdown grouping/order is handled separately, at render time, by {@link
 * HeaderNavHelper.renderGroup} and {@link NAV_LINK_GROUPS} — this array's own order is
 * not what drives visual order. Exported (even though nothing outside this module
 * needs it) so specs can assert `id` uniqueness directly.
 */
export const NAV_LINK_REGISTRY = [
  miniaturesItem('stl-models', 'stl_models', 'header.nav_stl_models'),
  miniaturesItem('sources', 'sources', 'header.nav_sources'),
  miniaturesItem('collections', 'collections', 'header.nav_collections'),

  adminItem('treasures', 'treasures', 'header.nav_treasures'),
  adminItem('staff-users', 'staff/users', 'header.nav_staff_users'),
  adminItem('staff-dashboard', 'staff/dashboard', 'header.nav_staff_dashboard'),

  gameItem('show', '', 'header.nav_game_show'),
  gameItem('pcs', '/pcs', 'game_page.player_characters'),
  gameItem('npcs', '/npcs', 'game_page.non_player_characters'),
  gameItem('treasures', '/treasures', 'game_page.treasures'),
  gameItem('items', '/items', 'game_page.items'),
  gameItem('possessions', '/possessions', 'game_page.possessions'),
  gameItem('factions', '/factions', 'game_page.factions'),
  gameItem('documents', '/documents', 'game_page.documents'),
  gameItem('players', '/players', 'game_page.players', HAS_GAME_ACCESS),
  gameItem('polls', '/polls', 'game_page.polls_title', HAS_GAME_ACCESS),
  gameItem('sessions', '/sessions', 'game_page.sessions', HAS_GAME_ACCESS),
  gameItem('photos', '/photos', 'game_page.see_all_photos'),

  ...characterItems('pc'),
  ...characterItems('npc'),
];

/**
 * Rendering helper for the Header's nav dropdowns (Miniatures, Admin, Game, PC/NPC),
 * split out of `HeaderHelper` to keep both files under the project's max-lines-per-file
 * limit.
 */
export default class HeaderNavHelper {
  /**
   * Renders every nav dropdown group, in {@link NAV_LINK_GROUPS}'s fixed order,
   * bucketing {@link NAV_LINK_REGISTRY}'s flat entries by `group` at render time.
   *
   * @param {object} state - header auth state.
   * @returns {React.ReactElement[]} the header's nav dropdowns (empty groups render as `null`).
   */
  static renderNavLinks(state) {
    const context = CurrentPageContext.build(state);

    return NAV_LINK_GROUPS.map((group) => (
      <React.Fragment key={group.id}>
        {HeaderNavHelper.renderGroup(
          group.id, Translator.t(group.titleKey), group.dropdownId, NAV_LINK_REGISTRY, context,
        )}
      </React.Fragment>
    ));
  }

  /**
   * Buckets `entries` down to the ones tagged `groupId`, filters them against `context`
   * via {@link RuleMatcher}, and renders a `NavDropdown` wrapper around the survivors —
   * or `null` when none survive. Extracted as its own function specifically so the
   * 0-survivors -> `null` branch can be unit-tested with a synthetic entry set, since no
   * real current entry set can produce an empty group.
   *
   * @param {string} groupId - Group id to bucket `entries` by (e.g. `'game'`).
   * @param {string} title - Translated dropdown title.
   * @param {string} dropdownId - `NavDropdown`'s `id` prop.
   * @param {{id: string, group: string, rules: object, render: Function}[]} entries - Full flat nav-link registry.
   * @param {object} context - Rendering context built by {@link CurrentPageContext}.
   * @returns {React.ReactElement|null} the group's `NavDropdown`, or `null` when it has no surviving entries.
   */
  static renderGroup(groupId, title, dropdownId, entries, context) {
    const survivors = entries
      .filter((entry) => entry.group === groupId)
      .filter((entry) => RuleMatcher.matches(entry.rules, context));

    if (survivors.length === 0) {
      return null;
    }

    return (
      <NavDropdown title={title} id={dropdownId} renderMenuOnMount>
        {survivors.map((entry) => (
          <React.Fragment key={entry.id}>{entry.render(context)}</React.Fragment>
        ))}
      </NavDropdown>
    );
  }
}
