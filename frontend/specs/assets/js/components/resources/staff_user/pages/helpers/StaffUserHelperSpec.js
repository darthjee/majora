import { renderToStaticMarkup } from 'react-dom/server';
import StaffUserHelper from '../../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx';

describe('StaffUserHelper', function() {
  const user = {
    id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved',
  };
  const emptyTokensState = { tokens: [], tokensLoading: false, tokensError: false };

  describe('.render', function() {
    it('renders the user name and email', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user, emptyTokensState));

      expect(html).toContain('Jane');
      expect(html).toContain('jane@example.com');
    });

    it('renders an edit link', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user, emptyTokensState));

      expect(html).toContain('href="#/staff/users/1/edit"');
    });

    it('renders a back button to the users index', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user, emptyTokensState));

      expect(html).toContain('href="#/staff/users"');
    });

    it('renders the status badge with its translated label', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user, emptyTokensState));

      expect(html).toContain('Status');
      expect(html).toContain('Approved');
      expect(html).toContain('bg-success');
    });

    it('renders the user detail block even when the token fetch failed', function() {
      const html = renderToStaticMarkup(
        StaffUserHelper.render(user, { tokens: [], tokensLoading: false, tokensError: true }),
      );

      expect(html).toContain('Jane');
      expect(html).toContain('jane@example.com');
    });
  });

  describe('recovery-token panel', function() {
    it('renders the loading message while the tokens are loading', function() {
      const html = renderToStaticMarkup(
        StaffUserHelper.render(user, { tokens: [], tokensLoading: true, tokensError: false }),
      );

      expect(html).toContain('Loading recovery tokens...');
    });

    it('renders an error message when the token fetch failed', function() {
      const html = renderToStaticMarkup(
        StaffUserHelper.render(user, { tokens: [], tokensLoading: false, tokensError: true }),
      );

      expect(html).toContain('Failed to load recovery tokens. Please try again.');
    });

    it('renders the empty state when the user has no tokens', function() {
      const html = renderToStaticMarkup(StaffUserHelper.render(user, emptyTokensState));

      expect(html).toContain('This user has no recovery tokens.');
    });

    it('renders a table row per token, with its status badge and masked preview', function() {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const tokens = [
        {
          id: 42, created_at: '2026-09-04T10:00:00Z', expires_at: future, used_at: null, invalidated_at: null,
          token_preview: 'aZ91Qk',
        },
      ];

      const html = renderToStaticMarkup(
        StaffUserHelper.render(user, { tokens, tokensLoading: false, tokensError: false }),
      );

      expect(html).toContain('Valid');
      expect(html).toContain('aZ91Qk');
      expect(html).toContain('2026-09-04T10:00:00Z');
      expect(html).toContain(future);
      expect(html).not.toContain('This user has no recovery tokens.');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(StaffUserHelper.renderLoading());
      expect(html).toContain('Loading user...');
    });
  });

  describe('.renderError', function() {
    it('renders the translated error message', function() {
      const html = renderToStaticMarkup(StaffUserHelper.renderError());
      expect(html).toContain('Failed to load user. Please try again.');
    });
  });
});
