import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import LoadingMessage from '../../../../../../assets/js/components/common/misc/LoadingMessage.jsx';

describe('LoadingMessage', function() {
  it('renders the message text', function() {
    const html = renderToStaticMarkup(
      React.createElement(LoadingMessage, { message: 'Loading games...' })
    );
    expect(html).toContain('Loading games...');
  });

  it('renders with muted text style', function() {
    const html = renderToStaticMarkup(
      React.createElement(LoadingMessage, { message: 'Loading...' })
    );
    expect(html).toContain('text-muted');
  });

  it('wraps in a centered container', function() {
    const html = renderToStaticMarkup(
      React.createElement(LoadingMessage, { message: 'Loading...' })
    );
    expect(html).toContain('container');
    expect(html).toContain('text-center');
  });
});
