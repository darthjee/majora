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
  });
});
