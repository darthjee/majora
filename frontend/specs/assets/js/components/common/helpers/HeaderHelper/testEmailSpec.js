import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    it('does not render the send-test-email button when logged out', function() {
      const html = render();

      expect(html).not.toContain('data-testid="send-test-email"');
    });

    it('does not render the send-test-email button when logged in but not staff or superuser', function() {
      const html = render({ loggedIn: true });

      expect(html).not.toContain('data-testid="send-test-email"');
    });

    it('renders the send-test-email button when logged in as a superuser', function() {
      const html = render({ loggedIn: true, isSuperUser: true });

      expect(html).toContain('data-testid="send-test-email"');
      expect(html).toContain('bi-envelope-fill');
      expect(html).toContain('title="Send test email"');
    });

    it('renders the send-test-email button when logged in as staff', function() {
      const html = render({ loggedIn: true, isStaff: true });

      expect(html).toContain('data-testid="send-test-email"');
      expect(html).toContain('bi-envelope-fill');
      expect(html).toContain('title="Send test email"');
    });

    it('renders a success message when the test email was sent', function() {
      const html = render({ loggedIn: true, isSuperUser: true, testEmailStatus: 'sent' });

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Test email sent');
    });

    it('renders an error message when the test email failed', function() {
      const html = render({ loggedIn: true, isSuperUser: true, testEmailStatus: 'error' });

      expect(html).toContain('data-testid="test-email-status"');
      expect(html).toContain('Failed to send test email');
    });

    it('renders no status message when testEmailStatus is null', function() {
      const html = render({ loggedIn: true, isSuperUser: true });

      expect(html).not.toContain('data-testid="test-email-status"');
    });
  });
});
