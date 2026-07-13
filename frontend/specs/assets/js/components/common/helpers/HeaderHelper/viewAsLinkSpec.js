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
  });
});
