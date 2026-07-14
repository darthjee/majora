import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    it('renders the resilience indicator', function() {
      const html = render();

      expect(html).toContain('data-testid="resilience-indicator"');
    });

    it('renders the resilience indicator regardless of auth state', function() {
      const html = render({ loggedIn: true });

      expect(html).toContain('data-testid="resilience-indicator"');
    });
  });
});
