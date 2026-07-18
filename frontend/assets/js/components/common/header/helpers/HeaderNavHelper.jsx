import NavDropdown from 'react-bootstrap/cjs/NavDropdown.js';
import Translator from '../../../../i18n/Translator.js';

/**
 * Rendering helper for the Header's nav dropdowns (Admin, Game, PC/NPC), split out of
 * `HeaderHelper` to keep both files under the project's max-lines-per-file limit.
 */
export default class HeaderNavHelper {
  /**
   * Renders the admin-or-staff-only "Admin" nav dropdown, grouping the
   * Treasures and Staff Users links.
   *
   * @param {{isSuperUser: boolean, isStaff: boolean}} state - header auth state.
   * @returns {React.ReactElement|null} the Admin nav dropdown, or null for non-staff/non-superusers.
   */
  static renderAdminNavLinks(state) {
    if (!state.isSuperUser && !state.isStaff) {
      return null;
    }

    return (
      <NavDropdown title={Translator.t('header.nav_admin')} id="header-admin-nav-dropdown" renderMenuOnMount>
        <NavDropdown.Item href="#/treasures">{Translator.t('header.nav_treasures')}</NavDropdown.Item>
        <NavDropdown.Item href="#/staff/users">{Translator.t('header.nav_staff_users')}</NavDropdown.Item>
      </NavDropdown>
    );
  }

  /**
   * Renders the "Game" nav dropdown while viewing any route nested under
   * `/games/:game_slug/...`, listing the game's key sections.
   *
   * @param {{route: ({gameSlug: (string|undefined)}|undefined), gameAccess: ({is_dm: boolean, is_player: boolean, is_superuser: boolean, is_staff: boolean}|undefined)}} state - header auth state.
   * @returns {React.ReactElement|null} the Game nav dropdown, or null when not on a game-scoped route.
   */
  static renderGameNavLinks(state) {
    const { gameSlug } = state.route ?? {};

    if (!gameSlug) {
      return null;
    }

    return (
      <NavDropdown title={Translator.t('header.nav_game')} id="header-game-nav-dropdown" renderMenuOnMount>
        <NavDropdown.Item href={`#/games/${gameSlug}`}>{Translator.t('header.nav_game_show')}</NavDropdown.Item>
        <NavDropdown.Item href={`#/games/${gameSlug}/pcs`}>{Translator.t('game_page.player_characters')}</NavDropdown.Item>
        <NavDropdown.Item href={`#/games/${gameSlug}/npcs`}>{Translator.t('game_page.non_player_characters')}</NavDropdown.Item>
        <NavDropdown.Item href={`#/games/${gameSlug}/treasures`}>{Translator.t('game_page.treasures')}</NavDropdown.Item>
        <NavDropdown.Item href={`#/games/${gameSlug}/items`}>{Translator.t('game_page.items')}</NavDropdown.Item>
        {HeaderNavHelper.#renderGameAccessNavItems(state, gameSlug)}
        <NavDropdown.Item href={`#/games/${gameSlug}/photos`}>{Translator.t('game_page.see_all_photos')}</NavDropdown.Item>
      </NavDropdown>
    );
  }

  /**
   * Renders the contextual "PC"/"NPC" nav dropdown while viewing any PC or
   * NPC character sub-route, listing the character's key sections.
   *
   * @param {{route: ({page: string, gameSlug: (string|undefined), characterId: (string|undefined)}|undefined)}} state - header auth state.
   * @returns {React.ReactElement|null} the PC/NPC nav dropdown, or null when not on a character route.
   */
  static renderCharacterNavLinks(state) {
    const page = state.route?.page;
    const isPc = page?.startsWith('pcCharacter');
    const isNpc = page?.startsWith('npcCharacter');

    if (!isPc && !isNpc) {
      return null;
    }

    const segment = isPc ? 'pcs' : 'npcs';
    const { gameSlug, characterId } = state.route;
    const base = `#/games/${gameSlug}/${segment}/${characterId}`;
    const title = Translator.t(isPc ? 'header.nav_pc' : 'header.nav_npc');
    const dropdownId = isPc ? 'header-pc-nav-dropdown' : 'header-npc-nav-dropdown';

    return (
      <NavDropdown title={title} id={dropdownId} renderMenuOnMount>
        <NavDropdown.Item href={base}>{Translator.t('header.nav_game_show')}</NavDropdown.Item>
        <NavDropdown.Item href={`${base}/photos`}>{Translator.t('character_page.see_all_photos')}</NavDropdown.Item>
        <NavDropdown.Item href={`${base}/treasures`}>{Translator.t('character_page.treasures_title')}</NavDropdown.Item>
        <NavDropdown.Item href={`${base}/items`}>{Translator.t('character_page.items_title')}</NavDropdown.Item>
      </NavDropdown>
    );
  }

  /**
   * Renders the Polls/Sessions dropdown items, restricted to the game's
   * DM(s), players, and admins (superuser/staff) — the same audience rule
   * used by `OpenPollsWidget`/`GamePollsController`.
   *
   * @param {{gameAccess: ({is_dm: boolean, is_player: boolean, is_superuser: boolean, is_staff: boolean}|undefined)}} state - header auth state.
   * @param {string} gameSlug - current game slug.
   * @returns {React.ReactElement|null} the Polls/Sessions dropdown items, or null when not allowed.
   */
  static #renderGameAccessNavItems(state, gameSlug) {
    const access = state.gameAccess ?? {};

    if (!(access.is_dm || access.is_player || access.is_superuser || access.is_staff)) {
      return null;
    }

    return (
      <>
        <NavDropdown.Item href={`#/games/${gameSlug}/polls`}>{Translator.t('game_page.polls_title')}</NavDropdown.Item>
        <NavDropdown.Item href={`#/games/${gameSlug}/sessions`}>{Translator.t('game_page.sessions')}</NavDropdown.Item>
      </>
    );
  }
}
