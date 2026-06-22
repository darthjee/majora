import Navbar from 'react-bootstrap/cjs/Navbar.js';
import Nav from 'react-bootstrap/cjs/Nav.js';
import Container from 'react-bootstrap/cjs/Container.js';
import LanguageSelector from '../LanguageSelector.jsx';
import LoginModal from '../LoginModal.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the Header element.
 */
export default class HeaderHelper {
  /**
   * Render the application header with navigation and auth controls.
   *
   * @param {{loggedIn: boolean, showModal: boolean, testEmailStatus: (string|null)}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function, onModalClose: Function, onLoginSuccess: Function, onSendTestEmailClick: Function, onLanguageChange: Function}} handlers - header event handlers.
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
            </Nav>
            <Nav className="align-items-center">
              {HeaderHelper.#renderAuthControl(state, handlers)}
              <LanguageSelector onLanguageChange={handlers.onLanguageChange} />
            </Nav>
          </Navbar.Collapse>
        </Container>
        <LoginModal
          show={state.showModal}
          onClose={handlers.onModalClose}
          onSuccess={handlers.onLoginSuccess}
        />
      </Navbar>
    );
  }

  /**
   * Renders the Login/Logoff control based on the current auth state.
   *
   * @param {{loggedIn: boolean, testEmailStatus: (string|null)}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function, onSendTestEmailClick: Function}} handlers - header event handlers.
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
          <button
            type="button"
            className="btn btn-link nav-link"
            data-testid="send-test-email"
            onClick={handlers.onSendTestEmailClick}
          >
            {Translator.t('header.send_test_email')}
          </button>
          {HeaderHelper.#renderTestEmailStatus(state)}
        </>
      );
    }

    return (
      <button
        type="button"
        className="btn btn-link nav-link"
        data-testid="auth-control"
        onClick={handlers.onLoginClick}
      >
        {Translator.t('header.login')}
      </button>
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
