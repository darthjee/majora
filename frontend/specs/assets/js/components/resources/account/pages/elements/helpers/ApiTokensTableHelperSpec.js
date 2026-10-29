import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokensTableHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokensTableHelper.jsx';
import ApiTokenRenameField from '../../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenRenameField.jsx';

const findAll = (node, matcher, found = []) => {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, matcher, found));
  } else if (node && typeof node === 'object') {
    if (matcher(node)) found.push(node);
    findAll(node.props?.children, matcher, found);
  }
  return found;
};
const buttons = (element) => findAll(element, (node) => node.type === 'button');

describe('ApiTokensTableHelper', function() {
  const tokens = [
    {
      id: 1, name: 'CI', prefix: 'ab12', scopes: ['npcs:read', 'npcs:write'], games: [],
      expires_at: null, last_used_at: null, created_at: '2026-01-01T00:00:00Z', status: 'active',
    },
    {
      id: 2, name: 'Old', prefix: 'cd34', scopes: ['games:read'], games: [{ slug: 'a', name: 'Alpha' }],
      expires_at: '2026-02-01T00:00:00Z', last_used_at: null, created_at: '2025-01-01T00:00:00Z', status: 'expired',
    },
  ];
  let handlers;

  beforeEach(function() {
    handlers = {
      onRenameStart: jasmine.createSpy('onRenameStart'),
      onRenameChange: jasmine.createSpy('onRenameChange'),
      onRenameSave: jasmine.createSpy('onRenameSave'),
      onRenameCancel: jasmine.createSpy('onRenameCancel'),
      onRevoke: jasmine.createSpy('onRevoke'),
    };
  });

  it('renders every column and the shared cells, in API order', function() {
    const html = renderToStaticMarkup(ApiTokensTableHelper.render(tokens, null, handlers));

    ['Name', 'Prefix', 'Scopes', 'Games', 'Expires', 'Last used', 'Created', 'Status', 'Actions']
      .forEach((label) => expect(html).toContain(`<th>${label}</th>`));
    expect(html).toContain('mjr_ab12…');
    expect(html).toContain('NPCs: read/write');
    expect(html).toContain('All games');
    expect(html).toContain('Alpha');
    expect(html).toContain('Never used');
    expect(html.indexOf('api-token-row-1')).toBeLessThan(html.indexOf('api-token-row-2'));
  });

  it('renders the statistics scope badge', function() {
    const html = renderToStaticMarkup(ApiTokensTableHelper.render(
      [{ ...tokens[0], scopes: ['statistics:read'] }], null, handlers,
    ));

    expect(html).toContain('Visitor statistics: read');
  });

  it('keeps Rename and Revoke on expired tokens', function() {
    const element = ApiTokensTableHelper.render([tokens[1]], null, handlers);
    const [rename, revoke] = buttons(element);

    rename.props.onClick();
    revoke.props.onClick();

    expect(handlers.onRenameStart).toHaveBeenCalledWith(tokens[1]);
    expect(handlers.onRevoke).toHaveBeenCalledWith(tokens[1]);
  });

  it('renders the inline rename field and Save/Cancel on the row being renamed', function() {
    const renaming = { id: 1, name: 'New', errors: { name: ['blank'] } };
    const element = ApiTokensTableHelper.render(tokens, renaming, handlers);
    const fields = findAll(element, (node) => node.type === ApiTokenRenameField);
    const [save, cancel] = buttons(element);

    expect(fields.length).toBe(1);
    expect(fields[0].props.value).toBe('New');
    expect(fields[0].props.errors).toEqual(['blank']);
    fields[0].props.onSave();
    save.props.onClick();
    cancel.props.onClick();
    expect(handlers.onRenameSave).toHaveBeenCalledWith(tokens[0]);
    expect(handlers.onRenameSave.calls.count()).toBe(2);
    expect(handlers.onRenameCancel).toHaveBeenCalled();
  });

  it('defaults missing rename errors to none', function() {
    const element = ApiTokensTableHelper.render(tokens, { id: 1, name: 'New' }, handlers);
    const field = findAll(element, (node) => node.type === ApiTokenRenameField)[0];

    expect(field.props.errors).toEqual([]);
  });
});
