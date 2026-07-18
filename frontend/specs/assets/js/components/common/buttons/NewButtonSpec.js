import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import NewButton from '../../../../../../assets/js/components/common/buttons/NewButton.jsx';

describe('NewButton', function() {
  it('renders an anchor with btn-primary and mb-3 classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(NewButton, { href: '#/games/new' }, 'New Game')
    );
    expect(html).toContain('btn-primary');
    expect(html).toContain('mb-3');
  });

  it('sets the href attribute from props', function() {
    const html = renderToStaticMarkup(
      React.createElement(NewButton, { href: '#/games/new' }, 'New Game')
    );
    expect(html).toContain('href="#/games/new"');
  });

  it('renders the children as link label', function() {
    const html = renderToStaticMarkup(
      React.createElement(NewButton, { href: '#/games/new' }, 'New Game')
    );
    expect(html).toContain('New Game');
  });
});
