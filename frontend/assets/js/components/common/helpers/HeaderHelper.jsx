import Navbar from 'react-bootstrap/cjs/Navbar.js';
import Nav from 'react-bootstrap/cjs/Nav.js';
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
   * @param {{loggedIn: boolean, showModal: boolean, testEmailStatus: (string|null), isSuperUser: boolean, serverStatus: (string|null), isStaff: boolean, route: ({page: string, gameSlug: (string|undefined), characterId: (string|undefined)}|undefined), canViewAs: boolean, showViewAsModal: boolean}} state - header auth state.
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
              {HeaderHelper.#renderTreasuresNavLink(state)}
              {HeaderHelper.#renderStaffUsersNavLink(state)}
              {HeaderHelper.#renderGameNavLinks(state)}
              {HeaderHelper.#renderCharacterPhotosNavLink(state)}
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
        <ViewAsModal show={state.showViewAsModal} onClose={handlers.onViewAsModalClose} />
      </Navbar>
    );
  }

  /**
   * Renders the admin-or-staff-only Treasures nav link.
   *
   * @param {{isSuperUser: boolean, isStaff: boolean}} state - header auth state.
   * @returns {React.ReactElement|null} treasures nav link, or null for non-superusers.
   */
  static #renderTreasuresNavLink(state) {
    if (!state.isSuperUser && !state.isStaff) {
      return null;
    }

    return <Nav.Link href="#/treasures">{Translator.t('header.nav_treasures')}</Nav.Link>;
  }

  /**
   * Renders the admin-or-staff-only Staff Users nav link.
   *
   * @param {{isSuperUser: boolean, isStaff: boolean}} state - header auth state.
   * @returns {React.ReactElement|null} staff users nav link, or null for non-staff/non-superusers.
   */
  static #renderStaffUsersNavLink(state) {
    if (!state.isSuperUser && !state.isStaff) {
      return null;
    }

    return <Nav.Link href="#/staff/users">{Translator.t('header.nav_staff_users')}</Nav.Link>;
  }

  /**
   * Renders the contextual Treasures/Sessions/Photos nav links while viewing a game page.
   *
   * @param {{route: ({page: string, gameSlug: (string|undefined)}|undefined)}} state - header auth state.
   * @returns {React.ReactElement|null} game nav links, or null when not on the game route.
   */
  static #renderGameNavLinks(state) {
    if (state.route?.page !== 'game') {
      return null;
    }

    const { gameSlug } = state.route;

    return (
      <>
        <Nav.Link href={`#/games/${gameSlug}/treasures`}>{Translator.t('game_page.treasures')}</Nav.Link>
        <Nav.Link href={`#/games/${gameSlug}/sessions`}>{Translator.t('game_page.sessions')}</Nav.Link>
        <Nav.Link href={`#/games/${gameSlug}/photos`}>{Translator.t('game_page.see_all_photos')}</Nav.Link>
      </>
    );
  }

  /**
   * Renders the contextual Photos nav link while viewing a PC or NPC character page.
   *
   * @param {{route: ({page: string, gameSlug: (string|undefined), characterId: (string|undefined)}|undefined)}} state - header auth state.
   * @returns {React.ReactElement|null} photos nav link, or null when not on a character route.
   */
  static #renderCharacterPhotosNavLink(state) {
    const page = state.route?.page;

    if (page !== 'pcCharacter' && page !== 'npcCharacter') {
      return null;
    }

    const segment = page === 'pcCharacter' ? 'pcs' : 'npcs';
    const { gameSlug, characterId } = state.route;

    return (
      <Nav.Link href={`#/games/${gameSlug}/${segment}/${characterId}/photos`}>
        {Translator.t('character_page.see_all_photos')}
      </Nav.Link>
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
   * Renders the "view as" button, visible only to real (facade-independent) superusers/staff.
   *
   * @param {{canViewAs: boolean}} state - header auth state.
   * @param {{onViewAsClick: Function}} handlers - header event handlers.
   * @returns {React.ReactElement|null} view-as button, or null when not applicable.
   */
  static #renderViewAsLink(state, handlers) {
    if (!state.canViewAs) {
      return null;
    }

    return (
      <Nav.Link
        href="#"
        data-testid="view-as-link"
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
