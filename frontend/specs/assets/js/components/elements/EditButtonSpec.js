import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import EditButton from '../../../../../assets/js/components/elements/EditButton.jsx';

describe('EditButton', function() {
  it('renders an anchor with btn-secondary and mb-3 classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(EditButton, { href: '#/games/slug/edit' }, 'Edit Game')
    );
    expect(html).toContain('btn-secondary');
    expect(html).toContain('mb-3');
  });

  it('sets the href attribute from props', function() {
    const html = renderToStaticMarkup(
      React.createElement(EditButton, { href: '#/games/slug/edit' }, 'Edit Game')
    );
    expect(html).toContain('href="#/games/slug/edit"');
  });

  it('renders the children as link label', function() {
    const html = renderToStaticMarkup(
      React.createElement(EditButton, { href: '#/games/slug/edit' }, 'Edit Game')
    );
    expect(html).toContain('Edit Game');
  });
});
