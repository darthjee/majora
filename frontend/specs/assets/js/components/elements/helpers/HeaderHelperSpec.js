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

  const buildState = (overrides = {}) => ({
    loggedIn: false,
    showModal: false,
    testEmailStatus: null,
    isSuperUser: false,
    serverStatus: null,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a Login control when logged out', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState(), buildHandlers())
      );

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Login');
      expect(html).not.toContain('Logoff');
    });

    it('renders a Logoff control when logged in', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ loggedIn: true }), buildHandlers())
      );

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Logoff');
    });

    it('renders a register control when logged out', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState(), buildHandlers())
      );

      expect(html).toContain('data-testid="register-control"');
      expect(html).toContain('href="#/users/register"');
      expect(html).toContain('Register');
    });

    it('does not render the register control when logged in', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ loggedIn: true }), buildHandlers())
      );

      expect(html).not.toContain('data-testid="register-control"');
    });

    it('renders a home link on the title', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState(), buildHandlers())
      );

      expect(html).toContain('href="#/"');
      expect(html).toContain('Majora');
    });

    it('renders a Games nav link', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState(), buildHandlers())
      );

      expect(html).toContain('href="#/games"');
      expect(html).toContain('Games');
    });

    it('renders a Treasures nav link when the user is a superuser', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ isSuperUser: true }), buildHandlers())
      );

      expect(html).toContain('href="#/treasures"');
      expect(html).toContain('Treasures');
    });

    it('does not render the Treasures nav link when the user is not a superuser', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ isSuperUser: false }), buildHandlers())
      );

      expect(html).not.toContain('href="#/treasures"');
    });

    it('does not render the send-test-email link when logged out', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState(), buildHandlers())
      );

      expect(html).not.toContain('data-testid="send-test-email"');
    });

    it('renders the send-test-email link when logged in', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ loggedIn: true }), buildHandlers())
      );

      expect(html).toContain('data-testid="send-test-email"');
      expect(html).toContain('Send test email');
    });

    it('renders a success message when the test email was sent', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ loggedIn: true, testEmailStatus: 'sent' }), buildHandlers())
      );

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Test email sent');
    });

    it('renders an error message when the test email failed', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ loggedIn: true, testEmailStatus: 'error' }), buildHandlers())
      );

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Failed to send test email');
    });

    it('renders no status message when testEmailStatus is null', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState({ loggedIn: true }), buildHandlers())
      );

      expect(html).not.toContain('data-testid="test-email-status"');
    });

    it('renders the language selector', function() {
      const html = renderToStaticMarkup(
        HeaderHelper.render(buildState(), buildHandlers())
      );

      expect(html).toContain('data-testid="language-selector"');
    });

    it('passes onLanguageChange through to the language selector', function() {
      const handlers = buildHandlers();

      expect(() => renderToStaticMarkup(
        HeaderHelper.render(buildState(), handlers)
      )).not.toThrow();
    });

    describe('server status indicator', function() {
      it('renders the up indicator for superusers when status is "up"', function() {
        const html = renderToStaticMarkup(
          HeaderHelper.render(
            buildState({ isSuperUser: true, serverStatus: 'up' }),
            buildHandlers()
          )
        );

        expect(html).toContain('data-testid="server-status"');
        expect(html).toContain('class="server-status up"');
      });

      it('renders the down indicator for superusers when status is "down"', function() {
        const html = renderToStaticMarkup(
          HeaderHelper.render(
            buildState({ isSuperUser: true, serverStatus: 'down' }),
            buildHandlers()
          )
        );

        expect(html).toContain('data-testid="server-status"');
        expect(html).toContain('class="server-status down"');
      });

      it('renders no indicator for superusers when status is null', function() {
        const html = renderToStaticMarkup(
          HeaderHelper.render(
            buildState({ isSuperUser: true, serverStatus: null }),
            buildHandlers()
          )
        );

        expect(html).not.toContain('data-testid="server-status"');
      });

      it('does not render the indicator for non-superusers even when status is "up"', function() {
        const html = renderToStaticMarkup(
          HeaderHelper.render(
            buildState({ isSuperUser: false, serverStatus: 'up' }),
            buildHandlers()
          )
        );

        expect(html).not.toContain('data-testid="server-status"');
      });

      it('does not render the indicator for non-superusers when status is "down"', function() {
        const html = renderToStaticMarkup(
          HeaderHelper.render(
            buildState({ isSuperUser: false, serverStatus: 'down' }),
            buildHandlers()
          )
        );

        expect(html).not.toContain('data-testid="server-status"');
      });
    });
  });
});
