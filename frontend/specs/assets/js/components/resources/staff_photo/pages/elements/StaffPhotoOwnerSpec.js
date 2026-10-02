import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoOwner from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoOwner.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

/**
 * @description Renders the owner element.
 * @param {object|null} owner - Owner.
 * @returns {string} Markup.
 */
function render(owner) {
  return renderToStaticMarkup(React.createElement(StaffPhotoOwner, { owner }));
}

const game = { slug: 'demo', name: 'Demo Game' };

describe('StaffPhotoOwner', function() {
  it('renders the orphan label when there is no owner', function() {
    expect(render(null)).toContain(Translator.t('staff_photos_page.owner_orphan'));
  });

  it('renders a link and the game name for a linkable owner', function() {
    const html = render({
      type: 'game_item', id: 3, name: 'Sword', kind: null, game,
    });

    expect(html).toContain('<a href="#/games/demo/items/3">Sword</a>');
    expect(html).toContain('Demo Game');
  });

  it('renders plain text for an owner without a link', function() {
    const html = render({
      type: 'character_item', id: 3, name: 'Ring', kind: null, game,
    });

    expect(html).toContain('<span>Ring</span>');
    expect(html).not.toContain('<a ');
    expect(html).toContain('Demo Game');
  });

  it('omits the game line for game owners', function() {
    const html = render({
      type: 'game', id: 1, name: 'Demo Game', kind: null, game,
    });

    expect(html).toBe('<div><a href="#/games/demo">Demo Game</a></div>');
  });

  it('omits the game line when the owner has no game', function() {
    const html = render({
      type: 'source', id: 1, name: 'Forge', kind: null, game: null,
    });

    expect(html).toBe('<div><a href="#/miniatures/sources/1">Forge</a></div>');
  });
});
