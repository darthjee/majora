import { renderToStaticMarkup } from 'react-dom/server';
import StaffUserApiTokensHelper
  from '../../../../../../../../assets/js/components/resources/staff_user/pages/helpers/StaffUserApiTokensHelper.jsx';
import ApiTokenCellsHelper
  from '../../../../../../../../assets/js/components/common/api_tokens/ApiTokenCellsHelper.jsx';

describe('StaffUserApiTokensHelper', function() {
  const token = {
    id: 5,
    name: 'CI bot',
    prefix: 'ab12cd',
    scopes: ['games:read'],
    games: [],
    expires_at: null,
    last_used_at: null,
    created_at: '2026-01-02T03:04:05Z',
    status: 'active',
  };
  const baseState = {
    tokens: [], loading: false, error: false, notice: null,
  };
  let handlers;

  beforeEach(function() {
    handlers = { onRevokePrompt: jasmine.createSpy('onRevokePrompt') };
  });

  const render = (overrides = {}) => renderToStaticMarkup(
    StaffUserApiTokensHelper.render({ ...baseState, ...overrides }, handlers),
  );

  it('renders the panel title', function() {
    expect(render()).toContain('API tokens');
  });

  it('renders the loading message while loading', function() {
    const html = render({ loading: true });

    expect(html).toContain('Loading API tokens...');
    expect(html).not.toContain('This user has no API tokens.');
  });

  it('renders the error alert when the fetch failed', function() {
    const html = render({ error: true });

    expect(html).toContain('Could not load this user&#x27;s API tokens.');
    expect(html).toContain('alert-danger');
  });

  it('renders the empty state when the user has no tokens', function() {
    const html = render();

    expect(html).toContain('This user has no API tokens.');
    expect(html).not.toContain('<table');
  });

  describe('with tokens', function() {
    it('renders a row per token with the shared columns and an actions column', function() {
      const html = render({ tokens: [token, { ...token, id: 6, name: 'Backup' }] });

      ['Name', 'Prefix', 'Scopes', 'Games', 'Expires', 'Last used', 'Created', 'Status', 'Actions']
        .forEach((header) => expect(html).toContain(`<th>${header}</th>`));
      expect(html).toContain('data-testid="staff-user-api-token-row-5"');
      expect(html).toContain('data-testid="staff-user-api-token-row-6"');
      expect(html.indexOf('CI bot')).toBeLessThan(html.indexOf('Backup'));
      expect(html).toContain('<code>mjr_ab12cd…</code>');
    });

    it('builds the cells through ApiTokenCellsHelper', function() {
      [
        'renderName', 'renderPrefix', 'renderScopes', 'renderGames',
        'renderExpires', 'renderLastUsed', 'renderCreated', 'renderStatus',
      ].forEach((method) => spyOn(ApiTokenCellsHelper, method).and.callThrough());

      render({ tokens: [token] });

      expect(ApiTokenCellsHelper.renderName).toHaveBeenCalledWith(token);
      expect(ApiTokenCellsHelper.renderPrefix).toHaveBeenCalledWith(token);
      expect(ApiTokenCellsHelper.renderScopes).toHaveBeenCalledWith(token);
      expect(ApiTokenCellsHelper.renderGames).toHaveBeenCalledWith(token);
      expect(ApiTokenCellsHelper.renderExpires).toHaveBeenCalledWith(token);
      expect(ApiTokenCellsHelper.renderLastUsed).toHaveBeenCalledWith(token);
      expect(ApiTokenCellsHelper.renderCreated).toHaveBeenCalledWith(token);
      expect(ApiTokenCellsHelper.renderStatus).toHaveBeenCalledWith(token);
    });

    it('renders the statistics scope badge', function() {
      const html = render({ tokens: [{ ...token, scopes: ['games:read', 'statistics:read'] }] });

      expect(html).toContain('Visitor statistics: read');
    });

    it('renders only a Revoke action, with no rename or create controls', function() {
      const html = render({ tokens: [token] });

      expect(html).toContain('Revoke');
      expect(html).not.toContain('Rename');
      expect(html).not.toContain('New token');
      expect(html).not.toContain('<input');
    });

    it('calls onRevokePrompt with the token when Revoke is clicked', function() {
      const table = StaffUserApiTokensHelper.render({ ...baseState, tokens: [token] }, handlers);
      const findButton = (node) => {
        if (!node || typeof node !== 'object') return null;
        if (node.type === 'button') return node;
        const children = [node.props?.children].flat(Infinity);
        return children.map(findButton).find(Boolean) ?? null;
      };

      findButton(table).props.onClick();

      expect(handlers.onRevokePrompt).toHaveBeenCalledWith(token);
    });
  });

  describe('notices', function() {
    it('renders the token_gone info alert above the still-visible table', function() {
      const html = render({ tokens: [token], notice: 'token_gone' });

      expect(html).toContain('alert-info');
      expect(html).toContain('This token no longer exists. The list has been refreshed.');
      expect(html).toContain('CI bot');
    });

    it('renders the action_error alert above the still-visible table', function() {
      const html = render({ tokens: [token], notice: 'action_error' });

      expect(html).toContain('alert-danger');
      expect(html).toContain('Could not revoke the API token. Please try again.');
      expect(html).toContain('CI bot');
    });

    it('renders no notice when notice is null', function() {
      const html = render({ tokens: [token] });

      expect(html).not.toContain('role="alert"');
    });
  });
});
