import React from 'react';
import Navbar from 'react-bootstrap/cjs/Navbar.js';
import Nav from 'react-bootstrap/cjs/Nav.js';
import NavDropdown from 'react-bootstrap/cjs/NavDropdown.js';
import Container from 'react-bootstrap/cjs/Container.js';
import LanguageSelector from '../../misc/LanguageSelector.jsx';
import ResilienceIndicator from '../../misc/ResilienceIndicator.jsx';
import LoginModal from '../../../resources/account/LoginModal.jsx';
import ViewAsModal from '../../modals/ViewAsModal.jsx';
import Translator from '../../../../i18n/Translator.js';
import Icons from '../../../../utils/ui/Icons.js';
import myAccountIcon from '../../../../../images/icons/my_account.svg';
import HeaderNavHelper from './HeaderNavHelper.jsx';
import CurrentPageContext from '../../../../utils/context/CurrentPageContext.js';
import RuleMatcher from '../../../../utils/rules/RuleMatcher.js';

const LOGGED_IN = { all: ['loggedIn'] };
const LOGGED_OUT = { none: ['loggedIn'] };

/**
 * Flat, declarative registry of the header's auth-control section: each entry
 * declares its own `rules` (evaluated by {@link RuleMatcher} against a {@link
 * CurrentPageContext}) and its own `render(context, handlers)`, so "what appears in
 * the header, and under what condition" is visible from one place. Declared in the
 * exact order the controls should appear, so default array order preserves visual
 * order once filtered. Exported (even though nothing outside this module needs it)
 * so specs can assert `id` uniqueness directly.
 */
export const AUTH_CONTROL_REGISTRY = [
  {
    id: 'login',
    rules: LOGGED_OUT,
    render: (context, handlers) => (
      <button
        type="button"
        className="btn btn-link nav-link"
        data-testid="auth-control"
        onClick={handlers.onLoginClick}
      >
        {Translator.t('header.login')}
      </button>
    ),
  },
  {
    id: 'register',
    rules: LOGGED_OUT,
    render: () => (
      <Nav.Link href="#/users/register" data-testid="register-control">
        {Translator.t('header.register')}
      </Nav.Link>
    ),
  },
  {
    id: 'logoff',
    rules: LOGGED_IN,
    render: (context, handlers) => (
      <button
        type="button"
        className="btn btn-link nav-link"
        data-testid="auth-control"
        onClick={handlers.onLogoffClick}
      >
        {Translator.t('header.logoff')}
      </button>
    ),
  },
  {
    id: 'send-test-email',
    rules: { all: ['loggedIn'], any: ['isSuperUser', 'isStaff'] },
    render: (context, handlers) => (
      <button
        type="button"
        className="btn btn-link nav-link"
        data-testid="send-test-email"
        title={Translator.t('header.send_test_email')}
        aria-label={Translator.t('header.send_test_email')}
        onClick={handlers.onSendTestEmailClick}
      >
        <i className={`bi ${Icons.envelopeFill}`} aria-hidden="true"></i>
      </button>
    ),
  },
  {
    id: 'test-email-status',
    rules: { all: ['loggedIn'], exists: ['testEmailStatus'] },
    render: (context) => {
      if (context.testEmailStatus === 'sent') {
        return <span data-testid="test-email-status">{Translator.t('header.test_email_sent')}</span>;
      }

      if (context.testEmailStatus === 'error') {
        return <span data-testid="test-email-status">{Translator.t('header.test_email_error')}</span>;
      }

      return null;
    },
  },
  {
    id: 'my-account-dropdown',
    rules: LOGGED_IN,
    render: () => (
      <NavDropdown
        title={(
          <img
            src={myAccountIcon}
            alt={Translator.t('header.my_account_alt')}
            title={Translator.t('header.my_account_alt')}
          />
        )}
        id="header-account-nav-dropdown"
        data-testid="my-account-dropdown"
        aria-label={Translator.t('header.my_account_alt')}
        renderMenuOnMount
      >
        <NavDropdown.Item href="#/my_account" data-testid="my-account-link">
          {Translator.t('header.my_account_alt')}
        </NavDropdown.Item>
        <NavDropdown.Item href="#/my-games" data-testid="my-games-link">
          {Translator.t('header.nav_my_games')}
        </NavDropdown.Item>
        <NavDropdown.Item
          href="#/account/authorization_requests"
          data-testid="authorization-requests-link"
        >
          {Translator.t('header.nav_authorization_requests')}
        </NavDropdown.Item>
      </NavDropdown>
    ),
  },
  {
    id: 'view-as-link',
    rules: { all: ['loggedIn', 'canViewAs'] },
    render: (context, handlers) => {
      const activeClass = context.facadeEnabled ? ' view-as-active' : '';

      return (
        <Nav.Link
          href="#"
          data-testid="view-as-link"
          className={`view-as-link${activeClass}`}
          onClick={handlers.onViewAsClick}
        >
          <i className={`bi ${Icons.viewAs}`} aria-hidden="true" title={Translator.t('header.view_as_alt')}></i>
        </Nav.Link>
      );
    },
  },
];

/**
 * Rendering helper for the Header element.
 */
export default class HeaderHelper {
  /**
   * Render the application header with navigation and auth controls.
   *
   * @param {{loggedIn: boolean, showModal: boolean, testEmailStatus: (string|null), isSuperUser: boolean, isStaff: boolean, route: ({page: string, gameSlug: (string|undefined), characterId: (string|undefined)}|undefined), gameAccess: ({is_dm: boolean, is_player: boolean, is_superuser: boolean, is_staff: boolean}|undefined), canViewAs: boolean, showViewAsModal: boolean, facadeEnabled: boolean}} state - header auth state.
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
              {HeaderNavHelper.renderNavLinks(state)}
            </Nav>
            <Nav className="align-items-center">
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
   * Renders the auth-control section (Login/Register, or Logoff/send-test-email/my-account/
   * view-as) by building the current rendering context once, then filtering and mapping
   * {@link AUTH_CONTROL_REGISTRY}.
   *
   * @param {object} state - header auth state.
   * @param {object} handlers - header event handlers.
   * @returns {React.ReactElement[]} the surviving auth-control entries' rendered elements.
   */
  static #renderAuthControl(state, handlers) {
    const context = CurrentPageContext.build(state);

    return AUTH_CONTROL_REGISTRY
      .filter((entry) => RuleMatcher.matches(entry.rules, context))
      .map((entry) => (
        <React.Fragment key={entry.id}>{entry.render(context, handlers)}</React.Fragment>
      ));
  }
}
