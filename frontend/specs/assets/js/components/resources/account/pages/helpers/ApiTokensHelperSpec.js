import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokensHelper from '../../../../../../../../assets/js/components/resources/account/pages/helpers/ApiTokensHelper.jsx';
import ApiTokensRetryAlert from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokensRetryAlert.jsx';
import ApiTokensTable from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokensTable.jsx';
import CreateApiTokenModal from '../../../../../../../../assets/js/components/resources/account/pages/elements/CreateApiTokenModal.jsx';
import ApiTokenRevokeConfirmModal from '../../../../../../../../assets/js/components/common/api_tokens/ApiTokenRevokeConfirmModal.jsx';

const findAll = (node, matcher, found = []) => {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, matcher, found));
  } else if (node && typeof node === 'object') {
    if (matcher(node)) found.push(node);
    findAll(node.props?.children, matcher, found);
  }
  return found;
};
const byTestId = (element, id) => findAll(element, (node) => node.props?.['data-testid'] === id);
const byType = (element, type) => findAll(element, (node) => node.type === type);

describe('ApiTokensHelper', function() {
  const options = { scopes: ['npcs:read'], games: [], all_games: false };
  const token = {
    id: 1, name: 'CI', prefix: 'ab', scopes: ['npcs:read'], games: [], expires_at: null, last_used_at: null,
    created_at: '2026-01-01T00:00:00Z', status: 'expired',
  };
  const handlers = {
    onRetry: jasmine.createSpy('onRetry'),
    onOpenCreate: jasmine.createSpy('onOpenCreate'),
    onCloseCreate: jasmine.createSpy('onCloseCreate'),
    onCreated: jasmine.createSpy('onCreated'),
    onRevokeConfirm: jasmine.createSpy('onRevokeConfirm'),
    onRevokeCancel: jasmine.createSpy('onRevokeCancel'),
  };
  const build = (state) => ApiTokensHelper.render({
    tokens: [],
    loading: false,
    error: false,
    options,
    optionsError: false,
    notice: null,
    renaming: null,
    revokeTarget: null,
    revoking: false,
    showCreate: false,
    ...state,
  }, handlers);

  it('renders the back link, the title and the intro', function() {
    const html = renderToStaticMarkup(build());

    expect(html).toContain('href="#/my_account"');
    expect(html).toContain('<h1>API tokens</h1>');
    expect(html).toContain('API tokens let automations');
  });

  it('enables "New token" once the options loaded', function() {
    const button = byTestId(build(), 'api-tokens-new')[0];

    button.props.onClick();

    expect(button.props.disabled).toBeFalse();
    expect(handlers.onOpenCreate).toHaveBeenCalled();
  });

  it('disables "New token" and shows a retry alert when the options failed', function() {
    const element = build({ options: null, optionsError: true });
    const alert = byType(element, ApiTokensRetryAlert);

    expect(byTestId(element, 'api-tokens-new')[0].props.disabled).toBeTrue();
    expect(alert.length).toBe(1);
    expect(alert[0].props.testId).toBe('api-tokens-options-error');
    expect(alert[0].props).toEqual(jasmine.objectContaining({ variant: 'warning', onRetry: handlers.onRetry }));
  });

  it('renders the loading message', function() {
    expect(renderToStaticMarkup(build({ loading: true }))).toContain('Loading API tokens...');
  });

  it('renders the load error with a retry', function() {
    const element = build({ error: true });
    const alert = byType(element, ApiTokensRetryAlert)[0];

    expect(renderToStaticMarkup(element)).toContain('Failed to load your API tokens.');
    expect(alert.props).toEqual(jasmine.objectContaining({ variant: 'danger', onRetry: handlers.onRetry }));
  });

  it('renders the empty state', function() {
    expect(renderToStaticMarkup(build())).toContain('You have no API tokens yet.');
  });

  it('renders the table with the tokens and rename state', function() {
    const renaming = { id: 1, name: 'x', errors: {} };
    const table = byType(build({ tokens: [token], renaming }), ApiTokensTable)[0];

    expect(table.props.tokens).toEqual([token]);
    expect(table.props.renaming).toBe(renaming);
    expect(table.props.handlers).toBe(handlers);
  });

  it('renders the token_gone notice as info', function() {
    const html = renderToStaticMarkup(build({ notice: 'token_gone' }));

    expect(html).toContain('alert-info');
    expect(html).toContain('This token no longer exists.');
  });

  it('renders the action_error notice as danger', function() {
    expect(renderToStaticMarkup(build({ notice: 'action_error' }))).toContain('alert alert-danger');
  });

  it('wires the revoke modal to the target', function() {
    const modal = byType(build({ revokeTarget: token, revoking: true }), ApiTokenRevokeConfirmModal)[0];

    expect(modal.props).toEqual(jasmine.objectContaining({
      show: true, tokenName: 'CI', submitting: true, onConfirm: handlers.onRevokeConfirm, onCancel: handlers.onRevokeCancel,
    }));
  });

  it('wires the create modal with the options and onCreated', function() {
    const modal = byType(build({ showCreate: true }), CreateApiTokenModal)[0];

    expect(modal.props).toEqual({
      show: true, options, onCancel: handlers.onCloseCreate, onCreated: handlers.onCreated,
    });
  });
});
