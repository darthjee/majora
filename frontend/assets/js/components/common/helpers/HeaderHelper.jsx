import Navbar from 'react-bootstrap/cjs/Navbar.js';
import Nav from 'react-bootstrap/cjs/Nav.js';
import NavDropdown from 'react-bootstrap/cjs/NavDropdown.js';
import Container from 'react-bootstrap/cjs/Container.js';
import LanguageSelector from '../LanguageSelector.jsx';
import ResilienceIndicator from '../ResilienceIndicator.jsx';
import LoginModal from '../LoginModal.jsx';
import ViewAsModal from '../ViewAsModal.jsx';
import Translator from '../../../i18n/Translator.js';
import Icons from '../../../utils/ui/Icons.js';
import myAccountIcon from '../../../../images/icons/my_account.svg';

/**
 * Rendering helper for the Header element.
 */
export default class HeaderHelper {
  /**
   * Render the application header with navigation and auth controls.
   *
   * @param {{loggedIn: boolean, showModal: boolean, testEmailStatus: (string|null), isSuperUser: boolean, serverStatus: (string|null), isStaff: boolean, route: ({page: string, gameSlug: (string|undefined), characterId: (string|undefined)}|undefined), gameAccess: ({is_dm: boolean, is_player: boolean, is_superuser: boolean, is_staff: boolean}|undefined), canViewAs: boolean, showViewAsModal: boolean, facadeEnabled: boolean}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function, onModalClose: Function, onLoginSuccess: Function, onSendTestEmailClick: Function, onLanguageChange: Function, onViewAsClick: Function, onViewAsModalClose: Function}} handlers - header event handlers.
   * @returns {React.ReactElement} Header element.
   */
  static render(state, handlers) {
    return (
      <Navbar bg="light" expand="md">
        <Container fluid>
          <Navbar.Brand href="#/">
            {Translator.t('header.title')}
            <small className="d-block text-muted">{Translator.t('header.subtitle')}</small>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="header-navbar" />
          <Navbar.Collapse id="header-navbar">
            <Nav className="me-auto">
              <Nav.Link href="#/games">{Translator.t('header.nav_games')}</Nav.Link>
              {HeaderHelper.#renderAdminNavLinks(state)}
              {HeaderHelper.#renderGameNavLinks(state)}
              {HeaderHelper.#renderCharacterNavLinks(state)}
            </Nav>
            <Nav className="align-items-center">
              {HeaderHelper.#renderServerStatus(state)}
              {HeaderHelper.#renderAuthControl(state, handlers)}
              <LanguageSelector onLanguageChange={handlers.onLanguageChange} />
              <ResilienceIndicator />
            </Nav>
          </Navbar.Collapse>
        </Container>
        <LoginModal
          show={state.showModal}
          onClose={handlers.onModalClose}
          onSuccess={handlers.onLoginSuccess}
        />
        <ViewAsModal show={state.showViewAsModal} onClose={handlers.onViewAsModalClose} gameSlug={state.route?.gameSlug} />
      </Navbar>
    );
  }

  /**
   * Renders the admin-or-staff-only "Admin" nav dropdown, grouping the
   * Treasures and Staff Users links.
   *
   * @param {{isSuperUser: boolean, isStaff: boolean}} state - header auth state.
   * @returns {React.ReactElement|null} the Admin nav dropdown, or null for non-staff/non-superusers.
   */
  static #renderAdminNavLinks(state) {
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
  static #renderGameNavLinks(state) {
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
        {HeaderHelper.#renderGameAccessNavItems(state, gameSlug)}
        <NavDropdown.Item href={`#/games/${gameSlug}/photos`}>{Translator.t('game_page.see_all_photos')}</NavDropdown.Item>
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

  /**
   * Renders the contextual "PC"/"NPC" nav dropdown while viewing any PC or
   * NPC character sub-route, listing the character's key sections.
   *
   * @param {{route: ({page: string, gameSlug: (string|undefined), characterId: (string|undefined)}|undefined)}} state - header auth state.
   * @returns {React.ReactElement|null} the PC/NPC nav dropdown, or null when not on a character route.
   */
  static #renderCharacterNavLinks(state) {
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
      </NavDropdown>
    );
  }

  /**
   * Renders the server status indicator for superusers.
   *
   * @param {{isSuperUser: boolean, serverStatus: (string|null)}} state - header auth state.
   * @returns {React.ReactElement|null} server status indicator, or null when not applicable.
   */
  static #renderServerStatus(state) {
    if (!state.isSuperUser) {
      return null;
    }

    if (state.serverStatus === 'up') {
      return <span className="server-status up" data-testid="server-status">&#9679;</span>;
    }

    if (state.serverStatus === 'down') {
      return <span className="server-status down" data-testid="server-status">&#9679;</span>;
    }

    return null;
  }

  /**
   * Renders the Login/Logoff control based on the current auth state.
   *
   * @param {{loggedIn: boolean, testEmailStatus: (string|null), canViewAs: boolean, isSuperUser: boolean, isStaff: boolean}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function, onSendTestEmailClick: Function, onViewAsClick: Function}} handlers - header event handlers.
   * @returns {React.ReactElement} login control, or logoff/send-test-email controls.
   */
  static #renderAuthControl(state, handlers) {
    if (state.loggedIn) {
      return (
        <>
          <button
            type="button"
            className="btn btn-link nav-link"
            data-testid="auth-control"
            onClick={handlers.onLogoffClick}
          >
            {Translator.t('header.logoff')}
          </button>
          {HeaderHelper.#renderSendTestEmailButton(state, handlers)}
          {HeaderHelper.#renderTestEmailStatus(state)}
          <Nav.Link href="#/my_account" data-testid="my-account-link">
            <img src={myAccountIcon} alt={Translator.t('header.my_account_alt')} />
          </Nav.Link>
          {HeaderHelper.#renderViewAsLink(state, handlers)}
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          className="btn btn-link nav-link"
          data-testid="auth-control"
          onClick={handlers.onLoginClick}
        >
          {Translator.t('header.login')}
        </button>
        <Nav.Link href="#/users/register" data-testid="register-control">
          {Translator.t('header.register')}
        </Nav.Link>
      </>
    );
  }

  /**
   * Renders the send-test-email button, visible only to superusers/staff.
   *
   * @param {{isSuperUser: boolean, isStaff: boolean}} state - header auth state.
   * @param {{onSendTestEmailClick: Function}} handlers - header event handlers.
   * @returns {React.ReactElement|null} send-test-email button, or null when not applicable.
   */
  static #renderSendTestEmailButton(state, handlers) {
    if (!state.isSuperUser && !state.isStaff) {
      return null;
    }

    return (
      <button
        type="button"
        className="btn btn-link nav-link"
        data-testid="send-test-email"
        title={Translator.t('header.send_test_email')}
        aria-label={Translator.t('header.send_test_email')}
        onClick={handlers.onSendTestEmailClick}
      >
        <i className={`bi ${Icons.envelope}`} aria-hidden="true"></i>
      </button>
    );
  }

  /**
   * Renders the "view as" button (real staff/superuser or DM), green ("engaged") while active.
   *
   * @param {{canViewAs: boolean, facadeEnabled: boolean}} state - header auth state.
   * @param {{onViewAsClick: Function}} handlers - header event handlers.
   * @returns {React.ReactElement|null} view-as button, or null when not applicable.
   */
  static #renderViewAsLink(state, handlers) {
    if (!state.canViewAs) {
      return null;
    }

    const activeClass = state.facadeEnabled ? ' view-as-active' : '';

    return (
      <Nav.Link
        href="#"
        data-testid="view-as-link"
        className={`view-as-link${activeClass}`}
        onClick={(event) => {
          event.preventDefault();
          handlers.onViewAsClick();
        }}
      >
        <i className={`bi ${Icons.viewAs}`} aria-hidden="true" title={Translator.t('header.view_as_alt')}></i>
      </Nav.Link>
    );
  }

  /**
   * Renders feedback for the last test email send attempt, if any.
   *
   * @param {{testEmailStatus: (string|null)}} state - header auth state.
   * @returns {React.ReactElement|null} feedback message, or null when there is none.
   */
  static #renderTestEmailStatus(state) {
    if (state.testEmailStatus === 'sent') {
      return <span data-testid="test-email-status">{Translator.t('header.test_email_sent')}</span>;
    }

    if (state.testEmailStatus === 'error') {
      return <span data-testid="test-email-status">{Translator.t('header.test_email_error')}</span>;
    }

    return null;
  }
}
