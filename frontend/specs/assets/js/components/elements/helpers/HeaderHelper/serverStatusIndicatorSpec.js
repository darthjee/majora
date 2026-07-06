import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
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
  });
});
