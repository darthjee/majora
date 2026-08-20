import { render } from './support.js';

describe('HeaderHelper', function() {
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

    describe('auth-control order', function() {
      it('renders the Login control before the Register control when logged out', function() {
        const html = render();

        expect(html.indexOf('data-testid="auth-control"')).toBeLessThan(html.indexOf('data-testid="register-control"'));
      });

      it('renders Logoff before the my-account dropdown when logged in', function() {
        const html = render({ loggedIn: true });

        expect(html.indexOf('data-testid="auth-control"')).toBeLessThan(html.indexOf('data-testid="my-account-dropdown"'));
      });

      it('renders the my-account dropdown before the view-as link when both are present', function() {
        const html = render({ loggedIn: true, canViewAs: true });

        expect(html.indexOf('data-testid="my-account-dropdown"')).toBeLessThan(html.indexOf('data-testid="view-as-link"'));
      });

      it('renders send-test-email before the my-account dropdown when both are present', function() {
        const html = render({ loggedIn: true, isSuperUser: true });

        expect(html.indexOf('data-testid="send-test-email"')).toBeLessThan(html.indexOf('data-testid="my-account-dropdown"'));
      });
    });
  });
});
