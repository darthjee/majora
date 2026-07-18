import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    it('does not render the view-as link when logged out, even if canViewAs is true', function() {
      const html = render({ canViewAs: true });

      expect(html).not.toContain('data-testid="view-as-link"');
    });

    it('does not render the view-as link when logged in but canViewAs is false', function() {
      const html = render({ loggedIn: true, canViewAs: false });

      expect(html).not.toContain('data-testid="view-as-link"');
    });

    it('renders the view-as link when logged in and canViewAs is true', function() {
      const html = render({ loggedIn: true, canViewAs: true });

      expect(html).toContain('data-testid="view-as-link"');
    });

    it('does not throw when the view-as modal is open', function() {
      expect(() => render({ loggedIn: true, canViewAs: true, showViewAsModal: true })).not.toThrow();
    });

    it('does not add the view-as-active class when the facade is disabled', function() {
      const html = render({ loggedIn: true, canViewAs: true, facadeEnabled: false });

      expect(html).toContain('view-as-link');
      expect(html).not.toContain('view-as-active');
    });

    it('adds the view-as-active class when the facade is enabled', function() {
      const html = render({ loggedIn: true, canViewAs: true, facadeEnabled: true });

      expect(html).toContain('view-as-link view-as-active');
    });
  });
});
