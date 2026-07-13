import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PageActions from '../../../../../assets/js/components/common/PageActions.jsx';

describe('PageActions', function() {
  it('renders the back button with the provided backHref', function() {
    const html = renderToStaticMarkup(
      React.createElement(PageActions, { backHref: '#/games' })
    );
    expect(html).toContain('href="#/games"');
  });

  it('renders children alongside the back button', function() {
    const html = renderToStaticMarkup(
      React.createElement(
        PageActions,
        { backHref: '#/games' },
        React.createElement('a', { href: '#/games/new' }, 'New Game')
      )
    );
    expect(html).toContain('href="#/games/new"');
    expect(html).toContain('New Game');
  });
});
