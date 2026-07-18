import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
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
  });
});
