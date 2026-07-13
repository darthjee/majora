import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import BackButton from '../../../../../assets/js/components/common/BackButton.jsx';

describe('BackButton', function() {
  it('delegates rendering to BackButtonHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(BackButton, { href: '#/games' })
    );
    expect(html).toContain('href="#/games"');
    expect(html).toContain('Back');
  });
});
