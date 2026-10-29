import { renderToStaticMarkup } from 'react-dom/server';
import AuthorizationRequestScopesHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/AuthorizationRequestScopesHelper.jsx';
import ApiTokenScopes from '../../../../../../../../../assets/js/components/common/api_tokens/ApiTokenScopes.js';

describe('AuthorizationRequestScopesHelper', function() {
  const render = (scopes) => renderToStaticMarkup(
    AuthorizationRequestScopesHelper.render(ApiTokenScopes.groupScopes(scopes), scopes),
  );

  it('renders the label and one item per family', function() {
    const html = render(['games:read', 'documents:write']);

    expect(html).toContain('Requested permissions');
    expect(html).toContain('<li>Games: read</li>');
    expect(html).toContain('<li>Documents: write</li>');
  });

  it('renders no warning without statistics:read', function() {
    const html = render(['games:read']);

    expect(html).not.toContain('alert-warning');
    expect(html).not.toContain('visitor IP addresses');
  });

  it('renders the statistics warning when statistics:read is requested', function() {
    const html = render(['games:read', 'statistics:read']);

    expect(html).toContain('<li>Visitor statistics: read</li>');
    expect(html).toContain('alert-warning');
    expect(html).toContain('This grants access to visitor IP addresses and visit history.');
  });
});
