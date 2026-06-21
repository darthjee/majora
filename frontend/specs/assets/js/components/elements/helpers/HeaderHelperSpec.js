import { renderToStaticMarkup } from 'react-dom/server';
import HeaderHelper from '../../../../../../assets/js/components/elements/helpers/HeaderHelper.jsx';

describe('HeaderHelper', function() {
  const buildHandlers = () => ({
    onLoginClick: jasmine.createSpy('onLoginClick'),
    onLogoffClick: jasmine.createSpy('onLogoffClick'),
    onModalClose: jasmine.createSpy('onModalClose'),
    onLoginSuccess: jasmine.createSpy('onLoginSuccess'),
    onSendTestEmailClick: jasmine.createSpy('onSendTestEmailClick'),
    onLanguageChange: jasmine.createSpy('onLanguageChange'),
  });

  describe('.render', function() {
    it('renders a Login control when logged out', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Login');
      expect(html).not.toContain('Logoff');
    });

    it('renders a Logoff control when logged in', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: true, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Logoff');
    });

    it('renders a home link on the title', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).toContain('href="#/"');
      expect(html).toContain('Majora');
    });

    it('renders a Games nav link', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).toContain('href="#/games"');
      expect(html).toContain('Games');
    });

    it('does not render the send-test-email link when logged out', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).not.toContain('data-testid="send-test-email"');
    });

    it('renders the send-test-email link when logged in', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: true, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).toContain('data-testid="send-test-email"');
      expect(html).toContain('Send test email');
    });

    it('renders a success message when the test email was sent', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: true, showModal: false, testEmailStatus: 'sent' }, buildHandlers())
      );

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Test email sent');
    });

    it('renders an error message when the test email failed', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: true, showModal: false, testEmailStatus: 'error' }, buildHandlers())
      );

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Failed to send test email');
    });

    it('renders no status message when testEmailStatus is null', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: true, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).not.toContain('data-testid="test-email-status"');
    });

    it('renders the language selector', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false, testEmailStatus: null }, buildHandlers())
      );

      expect(html).toContain('data-testid="language-selector"');
    });

    it('passes onLanguageChange through to the language selector', function() {
      const handlers = buildHandlers();

      expect(() => renderToStaticMarkup(
        HeaderHelper.render({ loggedIn: false, showModal: false, testEmailStatus: null }, handlers)
      )).not.toThrow();
    });
  });
});
