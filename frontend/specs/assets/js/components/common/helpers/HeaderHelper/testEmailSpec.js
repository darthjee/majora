import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
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
  });
});
