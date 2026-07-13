import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ActionsOverlay from '../../../../../../assets/js/components/common/ActionsOverlay.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('ActionsOverlay', function() {
  it('renders a CardPhoto by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
        url: 'http://example.com/photo.png',
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('card-photo-square');
    expect(html).toContain('http://example.com/photo.png');
  });

  it('renders a CardTreasureImage when type is treasure', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
        type: 'treasure',
        url: null,
        alt: 'Golden Crown',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('default_treasure.png');
  });

  it('renders a CardAvatar when type is avatar', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
        type: 'avatar',
        url: null,
        alt: 'Aragorn',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('default_character.png');
  });
});
