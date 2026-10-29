import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthorizationRequestScopes from '../../../../../../../../assets/js/components/resources/account/pages/elements/AuthorizationRequestScopes.jsx';

describe('AuthorizationRequestScopes', function() {
  const render = (props) => renderToStaticMarkup(React.createElement(AuthorizationRequestScopes, props));

  it('renders nothing when there are no scopes', function() {
    expect(render({})).toBe('');
  });

  it('renders nothing for an empty list', function() {
    expect(render({ scopes: [] })).toBe('');
  });

  it('renders nothing when every scope is unknown', function() {
    expect(render({ scopes: ['spells:read', 'admin:write'] })).toBe('');
  });

  it('renders the known scopes by their catalogue labels, in group order', function() {
    const html = render({ scopes: ['npcs:read', 'games:read', 'npcs:write'] });

    expect(html).toContain('Requested permissions');
    expect(html).toContain('<li>NPCs: read/write</li>');
    expect(html.indexOf('Games: read')).toBeLessThan(html.indexOf('NPCs: read/write'));
  });

  it('drops unknown scopes and never renders raw scope text', function() {
    const html = render({ scopes: ['npcs:read', '<b>spells:read</b>'] });

    expect(html).toContain('NPCs: read');
    expect(html).not.toContain('spells');
  });
});
