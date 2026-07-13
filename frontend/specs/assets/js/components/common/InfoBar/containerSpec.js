import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import InfoBar from '../../../../../../assets/js/components/common/InfoBar.jsx';

describe('InfoBar', function() {
  it('renders the always-visible info-overlay container by default (no items)', function() {
    const html = renderToStaticMarkup(React.createElement(InfoBar, {}));

    expect(html).toContain('info-overlay');
  });

  it('renders no content when items is empty', function() {
    const html = renderToStaticMarkup(React.createElement(InfoBar, { items: [] }));

    expect(html).toContain('<div class="info-overlay"></div>');
  });

  it('does not use any hover-triggered opacity class, unlike ActionBar', function() {
    const html = renderToStaticMarkup(React.createElement(InfoBar, { items: [] }));

    expect(html).not.toContain('actions-overlay-button');
  });
});
