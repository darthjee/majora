import { renderToStaticMarkup } from 'react-dom/server';
import StaffUserHelper from '../../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx';

describe('StaffUserHelper', function() {
  const user = {
    id: 1, name: 'Jane', email: 'jane@example.com', status: 'approved',
  };
  const emptyTokensState = {
    tokens: [], tokensLoading: false, tokensError: false, actionError: false,
  };

  const buildHandlers = () => ({
    onUnexpire: jasmine.createSpy('onUnexpire'),
    onForceExpirePrompt: jasmine.createSpy('onForceExpirePrompt'),
    onDeletePrompt: jasmine.createSpy('onDeletePrompt'),
    onGenerateRecoveryLink: jasmine.createSpy('onGenerateRecoveryLink'),
  });

  const render = (tokensState) => renderToStaticMarkup(
    StaffUserHelper.render(user, tokensState, buildHandlers()),
  );

  describe('.render', function() {
    it('renders the user name and email', function() {
      const html = render(emptyTokensState);

      expect(html).toContain('Jane');
      expect(html).toContain('jane@example.com');
    });

    it('renders an edit link', function() {
      const html = render(emptyTokensState);

      expect(html).toContain('href="#/staff/users/1/edit"');
    });

    it('renders a back button to the users index', function() {
      const html = render(emptyTokensState);

      expect(html).toContain('href="#/staff/users"');
    });

    it('renders the status badge with its translated label', function() {
      const html = render(emptyTokensState);

      expect(html).toContain('Status');
      expect(html).toContain('Approved');
      expect(html).toContain('bg-success');
    });

    it('renders the user detail block even when the token fetch failed', function() {
      const html = render({
        tokens: [], tokensLoading: false, tokensError: true, actionError: false,
      });

      expect(html).toContain('Jane');
      expect(html).toContain('jane@example.com');
    });
  });

  describe('recovery-token panel', function() {
    it('renders the loading message while the tokens are loading', function() {
      const html = render({
        tokens: [], tokensLoading: true, tokensError: false, actionError: false,
      });

      expect(html).toContain('Loading recovery tokens...');
    });

    it('renders an error message when the token fetch failed', function() {
      const html = render({
        tokens: [], tokensLoading: false, tokensError: true, actionError: false,
      });

      expect(html).toContain('Failed to load recovery tokens. Please try again.');
    });

    it('renders the empty state when the user has no tokens', function() {
      const html = render(emptyTokensState);

      expect(html).toContain('This user has no recovery tokens.');
    });

    it('always renders the panel-level generate recovery link button', function() {
      const html = render(emptyTokensState);

      expect(html).toContain('Generate recovery link');
    });

    it('renders the action-error alert without hiding the table', function() {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const tokens = [
        {
          id: 42, created_at: '2026-09-04T10:00:00Z', expires_at: future, used_at: null, invalidated_at: null,
          token_preview: 'aZ91Qk',
        },
      ];

      const html = render({
        tokens, tokensLoading: false, tokensError: false, actionError: true,
      });

      expect(html).toContain('That action could not be completed');
      expect(html).toContain('aZ91Qk');
    });

    it('does not render the action-error alert when actionError is false', function() {
      const html = render(emptyTokensState);

      expect(html).not.toContain('That action could not be completed');
    });

    it('renders a table row per token, with its status badge and masked preview', function() {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const tokens = [
        {
          id: 42, created_at: '2026-09-04T10:00:00Z', expires_at: future, used_at: null, invalidated_at: null,
          token_preview: 'aZ91Qk',
        },
      ];

      const html = render({
        tokens, tokensLoading: false, tokensError: false, actionError: false,
      });

      expect(html).toContain('Valid');
      expect(html).toContain('aZ91Qk');
      expect(html).toContain('2026-09-04T10:00:00Z');
      expect(html).toContain(future);
      expect(html).not.toContain('This user has no recovery tokens.');
    });

    describe('row actions', function() {
      const buildToken = (overrides) => ({
        id: 42,
        created_at: '2026-09-04T10:00:00Z',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        used_at: null,
        invalidated_at: null,
        token_preview: 'aZ91Qk',
        ...overrides,
      });

      it('shows unexpire and delete, but not force-expire, for an expired token', function() {
        const token = buildToken({ expires_at: new Date(Date.now() - 1000).toISOString() });
        const html = render({
          tokens: [token], tokensLoading: false, tokensError: false, actionError: false,
        });

        expect(html).toContain('Unexpire');
        expect(html).toContain('Delete');
        expect(html).not.toContain('Force expire');
      });

      it('shows unexpire and delete, but not force-expire, for a revoked token', function() {
        const token = buildToken({ invalidated_at: '2026-09-04T11:00:00Z' });
        const html = render({
          tokens: [token], tokensLoading: false, tokensError: false, actionError: false,
        });

        expect(html).toContain('Unexpire');
        expect(html).toContain('Delete');
        expect(html).not.toContain('Force expire');
      });

      it('shows force-expire and delete, but not unexpire, for a valid token', function() {
        const token = buildToken();
        const html = render({
          tokens: [token], tokensLoading: false, tokensError: false, actionError: false,
        });

        expect(html).toContain('Force expire');
        expect(html).toContain('Delete');
        expect(html).not.toContain('Unexpire');
      });

      it('shows only delete for a used token', function() {
        const token = buildToken({ used_at: '2026-09-04T11:00:00Z' });
        const html = render({
          tokens: [token], tokensLoading: false, tokensError: false, actionError: false,
        });

        expect(html).toContain('Delete');
        expect(html).not.toContain('Unexpire');
        expect(html).not.toContain('Force expire');
      });
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
