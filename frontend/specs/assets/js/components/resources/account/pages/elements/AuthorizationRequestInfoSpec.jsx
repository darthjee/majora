import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthorizationRequestInfo from '../../../../../../../../assets/js/components/resources/account/pages/elements/AuthorizationRequestInfo.jsx';

describe('AuthorizationRequestInfo', function() {
  it('renders nothing when there is no request', function() {
    const html = renderToStaticMarkup(React.createElement(AuthorizationRequestInfo, { request: null }));

    expect(html).toBe('');
  });

  it('renders the ip and browser fields', function() {
    const html = renderToStaticMarkup(
      React.createElement(AuthorizationRequestInfo, {
        request: { ip: '203.0.113.5', browser: 'Firefox on Linux' },
      })
    );

    expect(html).toContain('203.0.113.5');
    expect(html).toContain('Firefox on Linux');
    expect(html).toContain('IP address');
    expect(html).toContain('Browser');
  });
});
