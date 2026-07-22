import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPhotosPreviewSlot
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';

describe('CharacterPhotosPreviewSlot', function() {
  it('renders the photos preview title', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreviewSlot, {
        game_slug: 'demo', id: 7, is_pc: true, photos: [], handlers: {},
      }),
    );

    expect(html).toContain('Photos');
  });

  it('links to the pcs photos page for a PC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreviewSlot, {
        game_slug: 'demo', id: 7, is_pc: true, photos: [], handlers: {},
      }),
    );

    expect(html).toContain('href="#/games/demo/pcs/7/photos"');
  });

  it('links to the npcs photos page for an NPC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreviewSlot, {
        game_slug: 'demo', id: 7, is_pc: false, photos: [], handlers: {},
      }),
    );

    expect(html).toContain('href="#/games/demo/npcs/7/photos"');
  });
});
