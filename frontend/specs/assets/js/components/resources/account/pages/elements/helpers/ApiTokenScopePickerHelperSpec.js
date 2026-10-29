import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenScopePickerHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenScopePickerHelper.jsx';

describe('ApiTokenScopePickerHelper', function() {
  const handlers = {
    onToggle: jasmine.createSpy(), onSelectAllRead: jasmine.createSpy(), onSelectAllWrite: jasmine.createSpy(), onClear: jasmine.createSpy(),
  };
  const render = (state) => renderToStaticMarkup(ApiTokenScopePickerHelper.render(
    { value: [], errors: [], ...state }, handlers,
  ));

  it('renders only the catalogue scopes, grouped and with their help lines', function() {
    const html = render({ scopes: ['npcs:read', 'npcs:write', 'tasks:read'] });

    expect(html).toContain('data-testid="api-token-scope-npcs:read"');
    expect(html).toContain('data-testid="api-token-scope-npcs:write"');
    expect(html).toContain('data-testid="api-token-scope-tasks:read"');
    expect(html).not.toContain('data-testid="api-token-scope-tasks:write"');
    expect(html).not.toContain('api-token-scope-pcs');
    expect(html).toContain('Characters');
    expect(html).toContain('Non-player characters and everything nested under them');
    expect(html.indexOf('Tasks')).toBeLessThan(html.indexOf('NPCs'));
  });

  it('renders the Statistics group last, with no Write checkbox, when the catalogue has it', function() {
    const html = render({ scopes: ['npcs:read', 'statistics:read'] });

    expect(html).toContain('<th colSpan="3">Statistics</th>');
    expect(html).toContain('Visitor statistics');
    expect(html).toContain('Staff only.');
    expect(html).toContain('data-testid="api-token-scope-statistics:read"');
    expect(html).not.toContain('api-token-scope-statistics:write');
    expect(html.indexOf('NPCs')).toBeLessThan(html.indexOf('Visitor statistics'));
  });

  it('renders no Statistics row when the catalogue does not have it', function() {
    const html = render({ scopes: ['npcs:read', 'npcs:write'] });

    expect(html).not.toContain('Statistics');
    expect(html).not.toContain('api-token-scope-statistics');
  });

  it('renders the shortcuts and the scopes note, with no "everything" shortcut', function() {
    const html = render({ scopes: ['npcs:read'] });

    expect(html).toContain('Select all read');
    expect(html).toContain('Select all write');
    expect(html).toContain('Clear');
    expect(html).toContain('need the read scope of each of them');
  });

  it('marks selected scopes as checked', function() {
    const html = render({ scopes: ['npcs:read', 'npcs:write'], value: ['npcs:write'] });

    expect(html).toMatch(/data-testid="api-token-scope-npcs:write"[^>]*checked=""/);
    expect(html).not.toMatch(/data-testid="api-token-scope-npcs:read"[^>]*checked=""/);
  });

  it('renders the field errors', function() {
    expect(render({ scopes: [], errors: ['empty'] })).toContain('alert-danger');
  });
});
