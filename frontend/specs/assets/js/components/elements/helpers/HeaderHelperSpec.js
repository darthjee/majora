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
    isStaff: false,
    route: { page: 'home' },
    ...overrides,
  });

  const render = (overrides = {}, handlers = buildHandlers()) => renderToStaticMarkup(
    HeaderHelper.render(buildState(overrides), handlers)
  );

  describe('.render', function() {
    it('renders a Login control when logged out', function() {
      const html = render();

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Login');
      expect(html).not.toContain('Logoff');
    });

    it('renders a Logoff control when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="auth-control"');
      expect(html).toContain('Logoff');
    });

    it('renders a register control when logged out', function() {
      const html = render();

      expect(html).toContain('data-testid="register-control"');
      expect(html).toContain('href="#/users/register"');
      expect(html).toContain('Register');
    });

    it('does not render the register control when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).not.toContain('data-testid="register-control"');
    });

    it('renders a home link on the title', function() {
      const html = render();

      expect(html).toContain('href="#/"');
      expect(html).toContain('Majora');
    });

    it('renders a Games nav link', function() {
      const html = render();

      expect(html).toContain('href="#/games"');
      expect(html).toContain('Games');
    });

    it('renders a Treasures nav link when the user is a superuser', function() {
      const html = render({ isSuperUser: true });

      expect(html).toContain('href="#/treasures"');
      expect(html).toContain('Treasures');
    });

    it('does not render the Treasures nav link when the user is not a superuser', function() {
      const html = render({ isSuperUser: false });

      expect(html).not.toContain('href="#/treasures"');
    });

    it('renders a Staff Users nav link when the user is a superuser', function() {
      const html = render({ isSuperUser: true });

      expect(html).toContain('href="#/staff/users"');
      expect(html).toContain('Users');
    });

    it('renders a Staff Users nav link when the user is staff', function() {
      const html = render({ isStaff: true });

      expect(html).toContain('href="#/staff/users"');
    });

    it('does not render the Staff Users nav link when the user is neither staff nor a superuser', function() {
      const html = render({ isSuperUser: false, isStaff: false });

      expect(html).not.toContain('href="#/staff/users"');
    });

    it('does not render the send-test-email link when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="send-test-email"');
    });

    it('renders the send-test-email link when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="send-test-email"');
      expect(html).toContain('Send test email');
    });

    it('renders a success message when the test email was sent', function() {
      const html = render({ loggedIn: true, testEmailStatus: 'sent' });

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Test email sent');
    });

    it('renders an error message when the test email failed', function() {
      const html = render({ loggedIn: true, testEmailStatus: 'error' });

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Failed to send test email');
    });

    it('renders no status message when testEmailStatus is null', function() {
      const html = render({ loggedIn: true });

      expect(html).not.toContain('data-testid="test-email-status"');
    });

    it('does not render the my-account link when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="my-account-link"');
    });

    it('renders the my-account link when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="my-account-link"');
      expect(html).toContain('href="#/my_account"');
    });

    it('renders the language selector', function() {
      const html = render();

      expect(html).toContain('data-testid="language-selector"');
    });

    it('passes onLanguageChange through to the language selector', function() {
      expect(() => render()).not.toThrow();
    });

    describe('server status indicator', function() {
      it('renders the up indicator for superusers when status is "up"', function() {
        const html = render({ isSuperUser: true, serverStatus: 'up' });

        expect(html).toContain('data-testid="server-status"');
        expect(html).toContain('class="server-status up"');
      });

      it('renders the down indicator for superusers when status is "down"', function() {
        const html = render({ isSuperUser: true, serverStatus: 'down' });

        expect(html).toContain('data-testid="server-status"');
        expect(html).toContain('class="server-status down"');
      });

      it('renders no indicator for superusers when status is null', function() {
        const html = render({ isSuperUser: true, serverStatus: null });

        expect(html).not.toContain('data-testid="server-status"');
      });

      it('does not render the indicator for non-superusers even when status is "up"', function() {
        const html = render({ isSuperUser: false, serverStatus: 'up' });

        expect(html).not.toContain('data-testid="server-status"');
      });

      it('does not render the indicator for non-superusers when status is "down"', function() {
        const html = render({ isSuperUser: false, serverStatus: 'down' });

        expect(html).not.toContain('data-testid="server-status"');
      });
    });

    describe('game nav links', function() {
      it('renders Treasures, Sessions and Photos nav links on the game route', function() {
        const html = render({ route: { page: 'game', gameSlug: 'epic-quest' } });

        expect(html).toContain('href="#/games/epic-quest/treasures"');
        expect(html).toContain('Treasures');
        expect(html).toContain('href="#/games/epic-quest/sessions"');
        expect(html).toContain('Sessions');
        expect(html).toContain('href="#/games/epic-quest/photos"');
        expect(html).toContain('Photos');
      });

      it('does not render the game nav links on other routes', function() {
        const html = render({ route: { page: 'home' } });

        expect(html).not.toContain('/treasures"');
        expect(html).not.toContain('/sessions"');
      });

      it('does not render the game nav links when route is absent', function() {
        const html = render({ route: undefined });

        expect(html).not.toContain('/treasures"');
        expect(html).not.toContain('/sessions"');
      });
    });

    describe('character photos nav link', function() {
      it('renders a Photos link to the pc character photos page on the pcCharacter route', function() {
        const html = render({ route: { page: 'pcCharacter', gameSlug: 'epic-quest', characterId: '7' } });

        expect(html).toContain('href="#/games/epic-quest/pcs/7/photos"');
      });

      it('renders a Photos link to the npc character photos page on the npcCharacter route', function() {
        const html = render({ route: { page: 'npcCharacter', gameSlug: 'epic-quest', characterId: '9' } });

        expect(html).toContain('href="#/games/epic-quest/npcs/9/photos"');
      });

      it('does not render the Photos nav link on the game route', function() {
        const html = render({ route: { page: 'game', gameSlug: 'epic-quest' } });

        expect(html).not.toContain('pcs/7/photos');
        expect(html).not.toContain('npcs/9/photos');
      });

      it('does not render the Photos nav link on unrelated routes', function() {
        const html = render({ route: { page: 'home' } });

        expect(html).not.toContain('/photos"');
      });
    });
  });
});
