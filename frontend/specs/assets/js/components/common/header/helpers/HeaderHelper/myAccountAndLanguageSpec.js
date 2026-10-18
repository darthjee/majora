import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    it('does not render the my-account link when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="my-account-link"');
    });

    it('does not render the my-account dropdown when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="my-account-dropdown"');
    });

    it('renders the my-account link when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="my-account-link"');
      expect(html).toContain('href="#/my_account"');
    });

    it('renders the my-account dropdown toggle when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="my-account-dropdown"');
    });

    it('exposes the "My account" text as the dropdown toggle\'s accessible name/tooltip', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('aria-label="My account"');
      expect(html).toContain('title="My account"');
    });

    it('renders the "My account" text inside the dropdown item', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('>My account</a>');
    });

    it('does not render the my-games link when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="my-games-link"');
    });

    it('renders the my-games link when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="my-games-link"');
      expect(html).toContain('href="#/my-games"');
    });

    it('renders the "My Games" text inside the dropdown item', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('>My Games</a>');
    });

    it('does not render the authorization-requests link when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="authorization-requests-link"');
    });

    it('renders the authorization-requests link when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="authorization-requests-link"');
      expect(html).toContain('href="#/account/authorization_requests"');
    });

    it('renders the "Authorizations" text inside the dropdown item', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('>Authorizations</a>');
    });

    it('does not render the api-tokens link when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="api-tokens-link"');
    });

    it('renders the api-tokens link when logged in', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="api-tokens-link"');
      expect(html).toContain('href="#/account/api_tokens"');
    });

    it('renders the "API tokens" text inside the dropdown item', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('>API tokens</a>');
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
